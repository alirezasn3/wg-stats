package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

var admins []string
var peers map[string]*Peer = make(map[string]*Peer)
var totalRx uint64 = 0
var totalTx uint64 = 0
var currentRx uint64 = 0
var currentTx uint64 = 0

type Peer struct {
	Name            string `json:"name"`
	AllowedIps      string `json:"allowedIps"`
	LatestHandshake uint64 `json:"latestHandshake"`
	TotalRx         uint64 `json:"totalRx"`
	TotalTx         uint64 `json:"totalTx"`
	CurrentRx       uint64 `json:"currentRx"`
	CurrentTx       uint64 `json:"currentTx"`
	ExpiresAt       uint64 `json:"expiresAt"`
	exists          bool
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
	peerLines := strings.Split(strings.TrimSpace(string(bytes)), "\n")[1:]
	for _, p := range peerLines { // the first line is interface info
		info := strings.Split(p, "\t")
		if _, ok := peers[info[0]]; !ok {
			peers[info[0]] = &Peer{}
		}
		peers[info[0]].exists = true
		newTotalTx, _ := strconv.ParseUint(string(info[5]), 10, 64)
		newTotalRx, _ := strconv.ParseUint(string(info[6]), 10, 64)
		peers[info[0]].CurrentRx = newTotalRx - peers[info[0]].TotalRx
		peers[info[0]].CurrentTx = newTotalTx - peers[info[0]].TotalTx
		peers[info[0]].AllowedIps = string(info[3])
		peers[info[0]].LatestHandshake, _ = strconv.ParseUint(string(info[4]), 10, 64)
		peers[info[0]].TotalTx = newTotalTx
		peers[info[0]].TotalRx = newTotalRx
		if peers[info[0]].Name == "" {
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
			peers[info[0]].Name = string(bytes[i:j])
		}
		if peers[info[0]].ExpiresAt == 0 {
			peers[info[0]].ExpiresAt = uint64(time.Now().Unix() + 60*60*24*30)
		}
		tempTotalRx += peers[info[0]].TotalRx
		tempTotalTx += peers[info[0]].TotalTx
		tempCurrentRx += peers[info[0]].CurrentRx
		tempCurrentTx += peers[info[0]].CurrentTx
	}
	if len(peerLines) < len(peers) {
		for pk, p := range peers {
			if !p.exists {
				delete(peers, pk)
			}
		}
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
	updatePeersInfo()
	_, err := os.Stat("db.json")
	if errors.Is(err, os.ErrNotExist) {
		f, _ := os.Create("db.json")
		f.Close()
	}
	bytes, err := os.ReadFile("db.json")
	if err != nil {
		panic(err)
	}
	var data map[string]Peer
	err = json.Unmarshal(bytes, &data)
	if err == nil {
		for pk, p := range data {
			if _, ok := peers[pk]; !ok {
				continue
			}
			if p.ExpiresAt == 0 {
				peers[pk].ExpiresAt = uint64(time.Now().Unix() + 60*60*24*30)
			} else {
				peers[pk].ExpiresAt = p.ExpiresAt
			}
		}
	}
}

func main() {
	admins = os.Args[1:]
	go func() {
		for range time.NewTicker(time.Second).C {
			updatePeersInfo()
			bytes, _ := json.Marshal(peers)
			os.WriteFile("db.json", bytes, 0644)
		}
	}()
	http.Handle("/api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			name := findPeerNameByIp(strings.Split(r.Header.Get("X-Real-IP"), ":")[0])
			tempPeers := make(map[string]*Peer)
			isAdmin := false
			for _, n := range admins {
				if strings.Contains(name, n+"-") && len(n)+2 == len(name) {
					isAdmin = true
					break
				}
			}
			if isAdmin {
				tempPeers = peers
			} else {
				for pk, p := range peers {
					if strings.Contains(p.Name, strings.Split(name, "-")[0]+"-") && len(name) == len(p.Name) {
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
			isAdmin := false
			for _, n := range admins {
				if strings.Contains(name, n+"-") {
					isAdmin = true
					break
				}
			}
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
			w.WriteHeader(200)
		}
	}))
	http.ListenAndServe(":5051", nil)
}
