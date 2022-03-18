import express from "express";
import crypt from '../utils/crypt.js'
import mailGun from 'mailgun-js'

import { authenticateToken } from "../middlewares/authorization.js";

import initModels from "../models/init-models.js";
const router = express.Router();
import bcrypt from 'bcrypt';
import database from "../config/database.js";
const hashedDomain = '7dcecb51f53178edd7a6de01581da0b877ac22c459c6599c460cf8a438e5a2e62858b1e92c828e3d257fc9a16afb4a6aff40479f8e45184330814068f12e4764'
const hashedApi = '87188d3dedb0558b49e8baa28b414ee3175caac3e27f94bd73b5fdb0f0651bb206ecb4bfea83a060032bb0ce3fd864db'
const mailgun = mailGun({apiKey:crypt.decrypt(hashedApi),domain:crypt.decrypt(hashedDomain)});
const models = initModels(database);


router.get('/', authenticateToken, async (req,res)=>{
    try {
        
        const page = req.query.page||1;
        const size = req.query.size||5;
        const offset = (page-1)*size;
        const users= await models.userTable.findAll({offset: offset, limit: size});
      
        for(var i = 0 ;i<users.length;i++){
            delete users[i].dataValues.password;
        }
        
        return res.json(users);
    } catch (error) {
        res.status(500).json({error : error.message})
    }

});

router.post('/register',async (req,res)=>{
    
    try {
        const user = req.body;
        let userByEmail = await models.userTable.findAll({
            where:{
                email:user.email,
            }
        });
        if(userByEmail.length==0){
            
            const hashedPassword = await bcrypt.hash(user.password,10);
            await models.userTable.create({
                name:user.name,
                email:user.email,
                password:hashedPassword
            })
            const newUser = await models.userTable.findAll({
                where:{
                    email:user.email,
                }
            });

            await models.userRole.create({id:newUser[0].id,role: 'Normal'})
            const data = {
                from: 'Anh Pham HCMUS@fit.com',
                to: newUser[0].email,
                subject: 'Comfirm your mail',
                text: 'From MeU solutions \n'
                        +`Verify your mail here http://localhost:3000/api/users/verify/${newUser[0].id}`
                        +'\n Thank for your joining'
              };    
            mailgun.messages().send(data);
            res.json({message:"Please comfirm your mail"});
        }else res.send('Email has already exist')
        
    } catch (error) {
         console.log(error.message);
        res.status(500).json({error : error.message}) 
    }
})

router.get('/verify/:user_id',async (req,res)=>{
    const id = req.params.user_id||-1;
    try {
        if(id===-1){
            return res.json({message:"Invalid url"});
        }
        const user = await models.userTable.findAll({
            where:{
                id:id,
            }
        });
        
        if(user.length===0){
            return res.json({message:"User does not exist"});
        } else  if (user[0].verified==='0'){
            
            
            await models.userTable.update({verified:'1'}, 
            {
                where:{
                    id:id
                }
            })
            return res.json({message:'Verify Success'});
        }
        else 
            return res.json({message:'This account is verified'});
    } catch (error) {
        res.status(404).json({message:'Invalid id'})
    }
    
})

export default router;