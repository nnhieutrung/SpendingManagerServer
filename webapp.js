/////////////////modules///////////////
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressip = require('express-ip');
const passport = require("passport")
const session = require("express-session")
const path = require('path');   
const PORT = process.env.PORT || 5000
const app = express();



module.exports =
{
    main
}

 
let checkData = {
    data : {},
    Get : async function (typecheck, timerangestart)     {

        if (!this.data[typecheck] || !this.data[typecheck][timerangestart]) await this.Process(typecheck, timerangestart)

        return this.data[typecheck][timerangestart]
    },
    Process : async function (typecheck, timerangestart)    {
        timerangestart = parseInt(timerangestart)
        if (!this.data[typecheck])
            this.data[typecheck] = {}

        if (!this.data[typecheck][timerangestart])
            this.data[typecheck][timerangestart] = {}



        let onlinedata = await MongoClient.db("checkingonline").collection(typecheck).find().toArray()
        if (typecheck == 'ca') {
            let qydata = await MongoClient.db("checkingonline").collection('qy').find().toArray()
            onlinedata = onlinedata.concat(qydata)
        }  


        let timerangeend = timerangestart + 7*24*60*60*1000
  
        let data = []

        for (let i = 0 ; i < onlinedata.length; i++)
        {


            let timelistinweek = onlinedata[i].timelist.filter(time => (time >= timerangestart && time <= timerangeend))
            if (timelistinweek.length == 0) continue;
    
            let timelist = []
            let cacheindex = 0
            
            timelist.push({"timestart" : timelistinweek[0] , "timeend" : timelistinweek[0] })
    
            
            for (let j = 1 ; j < timelistinweek.length; j++)
            {
                if (timelistinweek[j] - timelist[cacheindex].timeend  < 1000*60*8) timelist[cacheindex--].timeend = timelistinweek[j]
                else timelist.push({"timestart" : timelistinweek[j] , "timeend" : timelistinweek[j]   })
                cacheindex++;
            }

            let sumtime = 0;

            for (let j = 0 ; j < timelist.length; j++)
                sumtime +=Math.round((timelist[j].timeend - timelist[j].timestart)/60000) + 5;
   
            data.push({"name" : onlinedata[i].name , "steamid" : onlinedata[i].steamid , "sumtime" : sumtime , "timelist" : timelist })
        }
    
        data.sort((a,b) => b.sumtime - a.sumtime)

        this.data[typecheck][timerangestart] = data

    }
}

