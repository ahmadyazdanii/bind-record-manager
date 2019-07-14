# bind-record-manager

[![npm version](https://www.npmjs.com/package/i2c-bus)]

Nodejs module for Parse and Generate recordFile of Bind DNS. Manager system

### Installation

Use the [npm](https://www.npmjs.com/) for install 

````js
npm install bind-record-manager --save
````

### Support
The module developed for [Bind9](https://www.isc.org/bind/) system and support A, AAAA, SOA, MX, NS, TXT, SRV, CNAME records.
### Usage

```javascript
/*
   import module
*/
const RecordManager = require('bind-record-manager') 

/* 
   generate new manager without record File path if you want work
   with recordFile follow `new RecordManager(<RecordFilePath>)` 
*/
const manager = new RecordManager() 

/*
   Parse raw data, if you used <RecordFilePath> for generate manager
   You do not need to define {RawData} in Parse function
*/
var parsedData = manager.Parse({RawData}) 

/*
   generate {custom-object} to string and you can write it to Record
   file or anything you want to do with it
*/
var generatedData = manager.Generate({custom-object})

```
##### {RawData}
```
$TTL 86400

; SOA Record
@   IN	SOA	localhost.com.	root.localhost.	(
1	 ;serial
604800	 ;refresh
86400	 ;retry
2419200	 ;expire
86400	 ;minimum ttl
)  ;#soa*4dq8f1e3

; NS Records

; MX Records
@	IN	MX	69	127.0.0.1		;#mx*9budq8f1

; A Records

; AAAA Records

; CNAME Records

; TXT Records

; SRV Records
```

##### {custom-object}
```object
{
     ttl: 86400,
     soa: {Options:{name: '@',
            id: "soa-id",
            minimum: 86400,
            expire: 2419200,
            retry: 86400,
            refresh: 604800,
            serial: 1,
            rname: 'root.localhost.',
            mname: "localhost.com." }},
     ns: [{Options:{
         name: '@',
         id: "ns-id",
         host: '127.0.0.1'
     }}]
}
```
### Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

### License
[MIT](https://github.com/ahmadyazdanii/bind-record-manager/blob/master/LICENSE)
