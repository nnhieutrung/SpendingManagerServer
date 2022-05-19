/////////////////modules///////////////
const express = require('express');
const path = require('path'); 
const PORT = process.env.PORT || 5000
const app = express();
const MongoDB =  require('mongodb');
const bodyParser = require('body-parser');

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
  let token = await GetRandomString(75);
  let checkToken = await MongoClient.db("main").collection("token").find({ token : token });
  if (checkToken.length > 0) return GetRandomToken();

  return token;
}

async function GetUserDataFromToken(token) {
  if (!token) return;
  let checkToken = await MongoClient.db("main").collection("token").find({ token : token, expires: { $gt: Date.now() } }).toArray();
  if (checkToken.length == 0) return;
  let checkData = await MongoClient.db("main").collection("account").find({ username : checkToken[0].username}).toArray();
  if (checkData.length == 0)  return;
  return checkData[0]
}




async function main()
{
  process.env.TZ = "Asia/Ho_Chi_Minh";
  console.log(`Started At : ${new Date().toLocaleString('vi-VN')}`)
  await MongoClient.connect();
  console.log("Database connected");

  app
    .set('views', path.join(__dirname, 'public'))
    .set('view engine', 'ejs')
    .engine('html', require('ejs').renderFile)  
    .get("/ping", async (req, res) => {
      try {
        res.json({data : Date.now()});
      }
      catch (e) {
        console.log(e)
      }
    })
    .get("/login", async (req, res) => {
      try {
        console.log("WRONGG")
        
      }
      catch (e) {
        console.error(e)
        return res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    .use(bodyParser())
    // POST without token
    .post("/login", async (req, res) => {
      try {
       
        let body = req.body;
        let data = await MongoClient.db("main").collection("account").find({username: body.username.toLowerCase(), password: body.password.toLowerCase()}).toArray()
        if (data.length > 0) {
          let token = await GetRandomToken()
          MongoClient.db("main").collection("token").insertOne({username: body.username, token: token, expires: Date.now()  + 24*60*60*1000 })
          console.log(`Create Token: ${token} for user ${body.username}`)
          return res.status(200).json({ token : token})
        }

        return res.status(200).json({ token : ""})
      }
      catch (e) {
        console.error(e)
        return res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    .post("/signup" , async (req, res) => {
      let body = req.body;
      body.username = (body.username || "").toLowerCase();
      body.password = (body.password || "").toLowerCase();
      body.createdOn = Date.now();

      let data = await MongoClient.db("main").collection("account").find({username: body.username.toLowerCase()}).toArray()
      if (data.length == 0) {
        let token = await GetRandomToken()
        MongoClient.db("main").collection("account").insertOne(body)
        console.log(`Create Token: username ${body.username} for person name ${body.fullname}`)
        return res.status(200).json({ message : "Bạn đã tạo tài khoản thành công"})
      }
      else  return res.status(200).json({ message : "Tên tài khoản đăng nhập hiện đã có vui lòng chọn tên khác"})
    })
    /// POST with Token
    .post("/*", async (req, res, next) => {
      try {
        let token = req.headers['token-user']
        let userData = await GetUserDataFromToken(token)
        if (userData) {
          req.userData = userData
          console.log("Authenticated: ", userData)
          next();
        }
          
        else
          res.status(401).json({ error: "Phiên đăng nhập không hợp lệ"});
      }
      catch (e) {
        console.error(e)
        res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    // Some get data
    .post("/account", async (req, res) => {
      try {
        let data = req.userData
        delete data.password;
        delete data._id;
        console.log("Get Account: ", data)
        res.status(200).json(data);
      }
      catch (e) {
        console.error(e)
        res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    .post("/wallets", async (req, res) => {
      try {
        let username = req.userData.username
        let data = await MongoClient.db("main").collection("wallet").find({username: username}).toArray()

        for (let i = 0; i < data.length; i++) 
          data[i].id = data[i]._id.toString()
        
        console.log(data)
        res.status(200).json(data);
      }
      catch (e) {
        console.error(e)
        res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    .post("/loans", async (req, res) => {
      try {
        let username = req.userData.username
        let data = await MongoClient.db("main").collection("loan").find({username: username}).toArray()

        for (let i = 0; i < data.length; i++) 
          data[i].id = data[i]._id.toString()
  
        console.log(data)
        res.status(200).json(data);
      }
      catch (e) {
        console.error(e)
        res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    .post("/debts", async (req, res) => {
      try {
        let username = req.userData.username
        let data = await MongoClient.db("main").collection("debt").find({username: username}).toArray()

        for (let i = 0; i < data.length; i++) 
          data[i].id = data[i]._id.toString()
        console.log(data)
        res.status(200).json(data);
      }
      catch (e) {
        console.error(e)
        res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    .post("/transactions", async (req, res) => {
      try {
        let username = req.userData.username
        let walletName = req.body.walletName || ""
        let data = await MongoClient.db("main").collection("transaction").find({username: username, walletName : walletName }).toArray()

        for (let i = 0; i < data.length; i++) 
          data[i].id = data[i]._id.toString()
    
        console.log(data)
        res.status(200).json(data);
      }
      catch (e) {
        console.error(e)
        res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
      }
    })
    // Some action
    .post("/editaccount", async (req, res) =>  {
    try {
      let data = req.userData
      delete data._id 
      
      let body = req.body

      for (let key in body) 
        data[key] = body[key]

      data.username = data.username.toLowerCase()
      data.password = data.password.toLowerCase()

      console.log("Update Account: ", data )
      await MongoClient.db("main").collection("account").updateOne({username : data.username},{$set: data})   
      res.status(200).json({"message" : "Cập nhật thông tin thành công"});
    }
    catch (e) {
      console.error(e)
      res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
    }
  })
  
  .post("/deposit", async (req, res) =>  {
    try {
      let username = req.userData.username
      let data = await MongoClient.db("main").collection("account").find({username: username}).toArray()
      data = data[0]
      if (!data)
        return res.status(200).json({"message" : "Tài khoản không tồn tại"});


      res.status(200).json({});
    }
    catch (e) {
      console.error(e)
      res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
    }
  })

  .post("/template", async (req, res) =>  {
    try {
      let username = req.userData.username

      res.status(200).json({});
    }
    catch (e) {
      console.error(e)
      res.status(406).json({ error : "Có lỗi phát sinh trên máy chủ. Vui lòng thử lại"});
    }
  })

  .listen(PORT, () => console.info("WebApp" , `Listening on ${ PORT }`))



}



main();
