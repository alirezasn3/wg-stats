package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"sort"
	"strconv"
	"strings"
	"time"
)

var users []User
var admins []string
var Rx int
var Tx int

type Database struct {
	Path  string
	Fd    *os.File
	Users []User
}

func (db *Database) Init(path string) {
	db.Path = path
	data, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}
	json.Unmarshal(data, &db.Users)
	db.Fd, err = os.Create(db.Path)
	if err != nil {
		panic(err)
	}
}

func (db *Database) UpdateUserByName(name string, user User) {
	for i := 0; i < len(db.Users); i++ {
		if db.Users[i].Name == name {
			db.Users[i] = user
		}
	}
}

func (db *Database) Commit() {
	bytes, _ := json.Marshal(db.Users)
	db.Fd.Write(bytes)
}

type User struct {
	Name             string
	Rx               int
	Tx               int
	LastestHandshake string
	AllowedIps       string
	ExpiresInDays    int
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

func getUsers() ([]User, error) {
	bytes, err := os.ReadFile("/etc/wireguard/wg0.conf")
	if err != nil {
		return nil, err
	}
	var clients map[string]string = make(map[string]string)
	for strings.Contains(string(bytes), "###") {
		i := strings.Index(string(bytes), "###")
		bytes = bytes[i+3:]
		i = strings.Index(string(bytes), "###")
		if i == -1 {
			i = len(bytes) - 1
		}
		data := strings.TrimSpace(string(bytes[:i]))
		parts := strings.Split(data, "\n")
		clients[strings.Split(parts[2], " = ")[1]] = strings.Split(parts[0], " ")[1]
	}
	cmd := exec.Command("sudo", "wg", "show")
	bytes, err = cmd.Output()
	if err != nil {
		return nil, err
	}
	var tempUsers []User
	for _, data := range strings.Split(string(bytes), "\n\n")[1:] {
		if name, ok := clients[strings.Split(strings.Split(data, "\n")[0], " ")[1]]; ok {
			ti := strings.Index(data, "transfer")
			ai := strings.Index(data, "allowed ips")
			allowedIpsLine := data[ai:]
			allowedIps := allowedIpsLine[13:strings.Index(allowedIpsLine, "/")]
			if ti > 0 {
				line := data[ti:]
				line = strings.Replace(line, "transfer: ", "", -1)
				line = strings.Replace(line, " received,", "", -1)
				line = strings.Replace(line, " sent", "", -1)
				statsParts := strings.Split(line, " ")
				tx, _ := strconv.ParseFloat(statsParts[0], 32)
				if statsParts[1] == "KiB" {
					tx *= 1000
				} else if statsParts[1] == "MiB" {
					tx *= 1000000
				} else if statsParts[1] == "GiB" {
					tx *= 1000000000
				}
				rx, _ := strconv.ParseFloat(statsParts[2], 32)
				if statsParts[3] == "KiB" {
					rx *= 1000
				} else if statsParts[3] == "MiB" {
					rx *= 1000000
				} else if statsParts[3] == "GiB" {
					rx *= 1000000000
				}
				handshakeIndex := strings.Index(data, "latest handshake:")
				handshakeLine := data[handshakeIndex:]
				newlineIndex := strings.Index(handshakeLine, "\n")
				lastestHandshake := handshakeLine[18:newlineIndex]
				tempUsers = append(tempUsers, User{
					Name:             name,
					Tx:               int(tx),
					Rx:               int(rx),
					LastestHandshake: lastestHandshake,
					AllowedIps:       allowedIps,
				})
			} else {
				tempUsers = append(tempUsers, User{
					Name:             name,
					Tx:               0,
					Rx:               0,
					LastestHandshake: "",
					AllowedIps:       allowedIps,
				})
			}
		}
	}
	sort.Slice(tempUsers, func(i, j int) bool {
		return tempUsers[i].Tx+tempUsers[i].Rx > tempUsers[j].Tx+tempUsers[j].Rx
	})
	return tempUsers, nil
}

func findUserByIp(ip string) string {
	for i := 0; i < len(users); i++ {
		if ip == users[i].AllowedIps {
			return users[i].Name
		}
	}
	return ""
}

func main() {
	db := Database{}
	db.Init("db.json")
	defer db.Commit()
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
			users, _ = getUsers()
			db.Users = users
		}
	}()
	http.Handle("/api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := findUserByIp(strings.Split(r.RemoteAddr, ":")[0])
		name = strings.Split(name, "-")[0]
		var temp []User
		isAdmin := false
		for _, n := range admins {
			if n == name {
				isAdmin = true
				break
			}
		}
		if isAdmin {
			temp = users
		} else {
			for _, u := range users {
				if strings.Contains(u.Name, name) {
					temp = append(temp, u)
				}
			}
		}
		data := make(map[string]interface{})
		data["Users"] = temp
		data["Rx"] = Rx
		data["Tx"] = Tx
		data["IsAdmin"] = isAdmin
		bytes, err := json.Marshal(data)
		if err != nil {
			w.Write([]byte("[]"))
			return
		}
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Write(bytes)
	}))
	http.ListenAndServe(":5051", nil)
}
