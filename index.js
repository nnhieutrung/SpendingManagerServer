/////////////////modules///////////////
const express = require('express');
const path = require('path'); 
const PORT = process.env.PORT || 5000
const app = express();
const MongoDB =  require('mongodb');

const config = require('./config.json');
MongoClient = new MongoDB.MongoClient(encodeURI(config.mongodb) , { useUnifiedTopology: true } );



async function main()
{

    setInterval( async () => { 

        for (let typecheck in checkData.data)
            for (let timerangestart in checkData.data[typecheck]) 
                await checkData.Process(typecheck, timerangestart)
        
    }, 2*60*1000)



    app
    .set('views', path.join(__dirname, 'public'))
    .set('view engine', 'ejs')
    .engine('html', require('ejs').renderFile)
    .get("/test", async (req, res) => {
      try {
        res.json({data : "pong"})
      }
      catch (e) {
        console.log(err)
      }
    })
    .listen(PORT, () => console.info("WebApp" , `Listening on ${ PORT }`))


}



main();
