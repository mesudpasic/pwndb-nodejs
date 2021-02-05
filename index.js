const express = require('express');
const tor = require('tor-request');
const bodyParser = require('body-parser');
const url = require('url');
const qs = require('querystring');
const cheerio = require('cheerio');

const PWNDB_URL="http://pwndb2am4tzkvold.onion/";
const LISTEN_PORT=8080;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/status', (req, response) => {
  tor.request(PWNDB_URL, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      response.send({status:"ok"});
    } else
    response.send({status:"offline"})
  });
});

app.get('/check', (req, response) => {
  const parseData=(body)=>{
    const $=cheerio.load(body);
    let data=$("section pre").text();    
    data=data.replace(/\t/g,"");
    data=data.replace(/\n/g,"");
    data=data.replace(/\(/g,"{");
    data=data.replace(/\)/g,"");
    data=data.replace(/\}\d+/g, '');
    let list=data.split('Array');
    let results=[];
    try
    {
      for (let i=1;i<list.length;i++){
        let s=list[i];
        let item={};
        item.id=s.split("[id] =>")[1].split("[")[0].trim();
        item.luser=s.split("[luser] =>")[1].split("[")[0].trim();
        item.domain=s.split("[domain] =>")[1].split("[")[0].trim();
        item.password=s.split("[password] =>")[1].split("[")[0].trim();      
        //skip donate domain, usually first item in array
        if (item.domain=="btc.thx")
          continue;
        results.push(item);
      }
    } catch(e){
      console.log(e);
    }
    return results;
  }
  let type=req.query.type;
  let input=req.query.input || "%";
  let body={};
  let luseropr=1;
  let domainopr=1;
  let submitform="em";
  let user=""
  let domain=""
  switch (type){
    case "e":
    default:
      if (input.indexOf("@")==-1){
        response.send({status:"failed",reason: "Bad input!"});
        return;
      }
      domain=input.split('@')[1];
      user=input.split('@')[0];      
      body={
        luser:encodeURIComponent(user),
        domain:encodeURIComponent(domain),
        luseropr:luseropr,
        domainopr:domainopr,
        submitform:submitform
      }
      break;
    case "d":
      domain=input;
      body={
        luser:encodeURIComponent(user),
        domain:encodeURIComponent(domain),
        luseropr:luseropr,
        domainopr:domainopr,
        submitform:submitform
      }
      break;
    case "p":
        submitform="pw";
        body={
          password:encodeURIComponent(input),
          submitform:submitform
        }
      break;
  }
  tor.request.post({url:PWNDB_URL, form: body}, function(err,httpResponse,body){
      if (!err && httpResponse.statusCode == 200) {
        response.send({status:"ok", data: parseData(body) });
      } else{
        response.send({status:"failed", reason:"Connection problem"})
      }
  });
  
});

app.listen(LISTEN_PORT, () =>
  console.log(`Service running on port ${LISTEN_PORT}.`)
);