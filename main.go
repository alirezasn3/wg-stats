package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

var admins []string
var Rx int
var Tx int
var peers map[string]*Peer = make(map[string]*Peer)

type Peer struct {
	Name            string
	AllowedIps      string
	LatestHandshake uint64
	Rx              uint64
	Tx              uint64
}

type bwOutput struct{}

func (c bwOutput) Write(p []byte) (int, error) {
	if strings.Contains(string(p), "rx") {
		var parts []string
		for _, p := range strings.Split(string(p[strings.Index(string(p), "rx"):]), " ") {
			if p != "" {
				parts = append(parts, p)
			}
		}
		rx, _ := strconv.ParseFloat(parts[1], 32)
		if parts[2] == "Mbit/s" {
			rx *= 1000000
		} else if parts[2] == "kbit/s" {
			rx *= 1000
		}
		tx, _ := strconv.ParseFloat(parts[6], 32)
		if parts[7] == "Mbit/s" {
			tx *= 1000000
		} else if parts[7] == "kbit/s" {
			tx *= 1000
		}
		Rx = int(rx)
		Tx = int(tx)
	}
	return len(p), nil
}

func updatePeersInfo() {
	cmd := exec.Command("wg", "show", "wg0", "dump")
	bytes, err := cmd.Output()
	if err != nil {
		panic(err)
	}
	for _, p := range strings.Split(strings.TrimSpace(string(bytes)), "\n")[1:] { // the first line is interface info
		info := strings.Split(p, "\t")
		if _, ok := peers[info[0]]; !ok {
			peers[info[0]] = &Peer{}
		}
		peers[info[0]].AllowedIps = string(info[3])
		peers[info[0]].LatestHandshake, _ = strconv.ParseUint(string(info[4]), 10, 64)
		peers[info[0]].Tx, _ = strconv.ParseUint(string(info[5]), 10, 64)
		peers[info[0]].Rx, _ = strconv.ParseUint(string(info[6]), 10, 64)
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
	}
}

func findUserByIp(ip string) string {
	for _, p := range peers {
		if strings.Contains(p.AllowedIps, ip) {
			return p.Name
		}
	}
	return ""
}

func main() {
	admins = os.Args[1:]
	go func() {
		cmd := exec.Command("vnstat", "-l")
		cmd.Stdout = bwOutput{}
		if err := cmd.Run(); err != nil {
			fmt.Println("could not run command: ", err)
		}
	}()
	go func() {
		for range time.NewTicker(time.Second).C {
			updatePeersInfo()
		}
	}()
	http.Handle("/api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := findUserByIp(strings.Split(r.RemoteAddr, ":")[0])
		name = strings.Split(name, "-")[0]
		tempPeers := make(map[string]*Peer)
		isAdmin := false
		for _, n := range admins {
			if n == name {
				isAdmin = true
				break
			}
		}
		if isAdmin {
			tempPeers = peers
		} else {
			for pk, p := range peers {
				if strings.Contains(p.Name, name) {
					tempPeers[pk] = p
				}
			}
		}
		data := make(map[string]interface{})
		data["Users"] = tempPeers
		data["Rx"] = Rx
		data["Tx"] = Tx
		data["IsAdmin"] = isAdmin
		bytes, err := json.Marshal(data)
		if err != nil {
			w.Write([]byte("{}"))
			return
		}
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Write(bytes)
	}))
	http.ListenAndServe(":5051", nil)
}
