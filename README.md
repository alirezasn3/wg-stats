# Wireguard Stats

Use this website to monitor a Wireguard server.

## Features

* Show each peer's sent and received traffic
* Show each peer's lastest handshake
* Show each peer's current bandwidth usage in realtime
* Show totol sent and received traffic for all users
* Show server's current bandwidth usage in realtime
* Show and modify each peer's remaining membership status (in days)
* Sort peers based on used traffic or current bandwidth usage
* Show and group peers that have the same name (example-1, example-2)
  
## TODO
- [ ] Add comments
- [ ] Organize code
- [ ] Improve membership modificaton UI/UX
- [ ] Add support for external database like MongoDB or 
- [ ] Add the ability to create new client
- [ ] Add the ability to create and show QR codes for client's config files

## Usage

* Wireguard should be installed using [angristan](https://github.com/angristan/wireguard-install)'s script.
* Client names should follow this format: `clientName`-`clientIndex`.
For example: `Alireza-0` or `Alirza-1`
Note that the grouping functionallity is case sensitive.
* Build the api using this command: `go build .`
* Build the front-end project using this command: `npm run build`
* Add service files to systemctl and start the services.
* Create config.json file

## Sample config file
```json
{
  "mongoURI": "mongodb+srv://username:password@clustername.mongodb.net/?retryWrites=true&w=majority",
  "dbName": "wgdb",
  "collectionName": "users",
  "admins": ["Alireza-0"]
}
```

## Screenshots

* Sort peers by traffic usage
![](screenshots/sort-by-traffic.png)
* Sort peers by realtime bandwidth usage
![](screenshots/sort-by-usage.png)
* Search peers
![](screenshots/search.png)
* Group view
![](screenshots/group-view.png)