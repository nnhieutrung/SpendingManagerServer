/////////////////modules///////////////
const express = require('express');
const path = require('path'); 
const PORT = process.env.PORT || 5000
const app = express();
const MongoDB =  require('mongodb');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


const config = require('./config.json');
MongoClient = new MongoDB.MongoClient(encodeURI(config.mongodb) , { useUnifiedTopology: true } );



async function GetRandomString(LENGTHTEXT)
{
  let codereturn = ''
  let textcache   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 1; i<= LENGTHTEXT ; i++)
  codereturn  += textcache.charAt(Math.floor(Math.random() *textcache.length))
  return codereturn;
}


async function GetRandomToken() {
  let token = await GetRandomString(10);
  let checkToken = await MongoClient.db("main").collection("token").find({ token : token });
  if (checkToken.length > 0) return GetRandomToken();

  return token;
}


async function CheckToken(req, res, next) {
  try {
    let token = req.query.token
    let checkToken = await MongoClient.db("main").collection("token").find({ token : token, expires: { $gt: now() } });
    if (checkToken.length > 0) return next();
  }
  catch (e) {
    res.status(404)
  }

}


async function main()
{

    app
    .set('views', path.join(__dirname, 'public'))
    .set('view engine', 'ejs')
    .engine('html', require('ejs').renderFile)  
    .get("/ping", async (req, res) => {
      try {
        res.json({data : "pong"})
      }
      catch (e) {
        console.log(err)
      }
    })
    .use(bodyParser())
    .post("/login", async (req, res) => {
      try {
        let data = req.body.data;
        let username = data.user;
        let hashPass = data.password;
        let userData = await MongoClient.db("main").collection("account").find({username: username, password: hashPass}).toArray()
        if (userData.length > 0) {
          let token = GetRandomToken()
          MongoClient.db("main").collection("token").insertOne({username: username, token: token, expires: Date.now()  + 24*60*60*1000 })
        }
      }
      catch (e) {
        return res.status(404);
      }
    })
    .post("/signup" , async (req, res) => {

    })
    .listen(PORT, () => console.info("WebApp" , `Listening on ${ PORT }`))



}



main();
