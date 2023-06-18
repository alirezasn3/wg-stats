package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/exp/slices"
)

var config Config
var coll *mongo.Collection
var peers map[string]*Peer = make(map[string]*Peer)
var totalRx uint64 = 0
var totalTx uint64 = 0
var currentRx uint64 = 0
var currentTx uint64 = 0

type Config struct {
	MongoURI       string   `json:"mongoURI"`
	DBName         string   `json:"dbName"`
	CollectionName string   `json:"collectionName"`
	Admins         []string `json:"admins"`
}

type Peer struct {
	Name            string `bson:"name,omitempty" json:"name"`
	PublicKey       string `bson:"publicKey,omitempty" json:"publicKey"`
	PresharedKey    string `bson:"presharedKey,omitempty" json:"presharedKey"`
	AllowedIps      string `bson:"allowedIps,omitempty" json:"allowedIps"`
	ExpiresAt       uint64 `bson:"expiresAt,omitempty" json:"expiresAt"`
	LatestHandshake uint64 `json:"latestHandshake"`
	TotalRx         uint64 `json:"totalRx"`
	TotalTx         uint64 `json:"totalTx"`
	CurrentRx       uint64 `json:"currentRx"`
	CurrentTx       uint64 `json:"currentTx"`
}

func updatePeersInfo() {
	cmd := exec.Command("wg", "show", "wg0", "dump")
	bytes, err := cmd.Output()
	if err != nil {
		panic(err)
	}
	var tempCurrentRx uint64 = 0
	var tempCurrentTx uint64 = 0
	var tempTotalRx uint64 = 0
	var tempTotalTx uint64 = 0
	peerLines := strings.Split(strings.TrimSpace(string(bytes)), "\n")[1:] // the first line is interface info
	if len(peers) > len(peerLines) {
		var tempPeers []Peer
		cursor, err := coll.Find(context.TODO(), bson.D{})
		if err != nil {
			panic(err)
		}
		if err = cursor.All(context.TODO(), &tempPeers); err != nil {
			panic(err)
		}
		for _, p := range tempPeers {
			if !strings.Contains(string(bytes), p.PublicKey) {
				fmt.Printf("removing [%s] with public key [%s]\n", p.Name, p.PublicKey)
				delete(peers, p.PublicKey)
				_, err := coll.DeleteMany(context.TODO(), bson.D{{Key: "publicKey", Value: p.PublicKey}})
				if err != nil {
					panic(err)
				}
			}
		}
	}
	for _, p := range peerLines {
		info := strings.Split(p, "\t")
		if _, ok := peers[info[0]]; !ok {
			fmt.Printf("creating peer with public key [%s]\n", info[0])
			peers[info[0]] = &Peer{}
			peers[info[0]].PublicKey = info[0]
			peers[info[0]].PresharedKey = info[1]
			peers[info[0]].AllowedIps = string(info[3])
			peers[info[0]].ExpiresAt = uint64(time.Now().Unix() + 60*60*24*30)
			_, err = coll.InsertOne(context.TODO(), peers[info[0]])
			if err != nil {
				panic(err)
			}
		}
		peers[info[0]].PresharedKey = info[1]
		bytes, err := os.ReadFile("/etc/wireguard/wg0.conf")
		if err != nil {
			panic(err)
		}
		j := strings.Index(string(bytes), "\n[Peer]\nPublicKey = "+info[0])
		i := j - 1
		for string(bytes[i]) != " " && i >= 0 {
			i--
		}
		i++
		if peers[info[0]].Name != string(bytes[i:j]) {
			peers[info[0]].Name = string(bytes[i:j])
			_, err = coll.UpdateOne(context.TODO(), bson.D{{Key: "publicKey", Value: peers[info[0]].PublicKey}}, bson.D{{Key: "$set", Value: bson.D{{Key: "name", Value: string(bytes[i:j])}}}})
			if err != nil {
				panic(err)
			}
		}
		newTotalTx, _ := strconv.ParseUint(string(info[5]), 10, 64)
		newTotalRx, _ := strconv.ParseUint(string(info[6]), 10, 64)
		peers[info[0]].CurrentRx = newTotalRx - peers[info[0]].TotalRx
		peers[info[0]].CurrentTx = newTotalTx - peers[info[0]].TotalTx
		peers[info[0]].LatestHandshake, _ = strconv.ParseUint(string(info[4]), 10, 64)
		peers[info[0]].TotalTx = newTotalTx
		peers[info[0]].TotalRx = newTotalRx
		tempTotalRx += peers[info[0]].TotalRx
		tempTotalTx += peers[info[0]].TotalTx
		tempCurrentRx += peers[info[0]].CurrentRx
		tempCurrentTx += peers[info[0]].CurrentTx
	}
	totalRx = tempTotalRx
	totalTx = tempTotalTx
	currentRx = tempCurrentRx
	currentTx = tempCurrentTx
}

func findPeerNameByIp(ip string) string {
	for _, p := range peers {
		for _, aip := range strings.Split(p.AllowedIps, ",") {
			if strings.Split(aip, "/")[0] == ip {
				return p.Name
			}
		}
	}
	return ""
}

func findPeerPublicKeyByName(name string) string {
	for pk, p := range peers {
		if strings.Contains(p.Name, name) {
			return pk
		}
	}
	return ""
}

func init() {
	configPath := "config.json"
	if len(os.Args) > 1 {
		configPath = os.Args[1] + configPath
	}
	bytes, err := os.ReadFile(configPath)
	if err != nil {
		panic(err)
	}
	err = json.Unmarshal(bytes, &config)
	if err != nil {
		panic(err)
	}
	client, err := mongo.Connect(
		context.TODO(),
		options.Client().ApplyURI(config.MongoURI).SetServerAPIOptions(options.ServerAPI(options.ServerAPIVersion1)))
	if err != nil {
		panic(err)
	}
	coll = client.Database(config.DBName).Collection(config.CollectionName)
	var data []Peer
	cursor, err := coll.Find(context.TODO(), bson.D{})
	if err != nil {
		panic(err)
	}
	if err = cursor.All(context.TODO(), &data); err != nil {
		panic(err)
	}
	for _, p := range data {
		peers[p.PublicKey] = &Peer{}
		peers[p.PublicKey].Name = p.Name
		peers[p.PublicKey].AllowedIps = p.AllowedIps
		peers[p.PublicKey].ExpiresAt = p.ExpiresAt
		peers[p.PublicKey].PublicKey = p.PublicKey
		peers[p.PublicKey].LatestHandshake = p.LatestHandshake
	}
}

func main() {
	go func() {
		for range time.NewTicker(time.Second).C {
			updatePeersInfo()
		}
	}()
	http.Handle("/api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			ra := r.Header.Get("X-Real-IP")
			if ra == "" {
				ra = r.RemoteAddr
			}
			name := findPeerNameByIp(strings.Split(ra, ":")[0])
			tempPeers := make(map[string]*Peer)
			isAdmin := slices.Contains(config.Admins, name)
			if isAdmin {
				tempPeers = peers
			} else {
				for pk, p := range peers {
					if strings.Contains(p.Name, strings.Split(name, "-")[0]+"-") {
						tempPeers[pk] = p
					}
				}
			}
			data := make(map[string]interface{})
			data["peers"] = tempPeers
			data["totalRx"] = totalRx
			data["totalTx"] = totalTx
			data["currentRx"] = currentRx
			data["currentTx"] = currentTx
			data["isAdmin"] = isAdmin
			bytes, err := json.Marshal(data)
			if err != nil {
				w.Write([]byte("{}"))
				return
			}
			w.Header().Add("Access-Control-Allow-Origin", "*")
			w.Write(bytes)
		} else if r.Method == "POST" {
			name := findPeerNameByIp(strings.Split(r.Header.Get("X-Real-IP"), ":")[0])
			isAdmin := slices.Contains(config.Admins, name)
			if !isAdmin {
				w.WriteHeader(403)
				return
			}
			defer r.Body.Close()
			bytes, err := io.ReadAll(r.Body)
			if err != nil {
				w.WriteHeader(400)
				return
			}
			p := Peer{}
			err = json.Unmarshal(bytes, &p)
			if err != nil {
				w.WriteHeader(400)
				return
			}
			peers[findPeerPublicKeyByName(p.Name)].ExpiresAt = p.ExpiresAt
			_, err = coll.UpdateOne(context.TODO(), bson.D{{Key: "publicKey", Value: peers[findPeerPublicKeyByName(p.Name)].PublicKey}}, bson.M{"$set": bson.M{"expiresAt": p.ExpiresAt}})
			if err != nil {
				panic(err)
			}
			w.WriteHeader(200)
		}
	}))
	if err := http.ListenAndServe(":5051", nil); err != nil {
		panic(err)
	}
}
