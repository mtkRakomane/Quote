const express = require('express');
const pasth = require('path');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const mongoose =require('mongoose');
const { kStringMaxLength } = require('buffer');
const connect =mongoose.connect('mongodb://localhost:27017/Quantity');

connect.then(() =>{
    console.log('Database coonected succeefullly');
})
.catch(()=>{
    console.log('Database cannot connect');
})

const userSchema = new mongoose.Schema({
    saleName:String,
    ref_num:String,
    name: String,
    email: String,
    cell: String,
    role: String,
    customer_name:String,
    customer_call_person:String,
    customer_email:String,
    billing:[{
        type:{
            bill_title:String,
           
            items: [{
                type:{
                    descriptions: String,
                    install_difficulty: String,
                    factor: Number,
                    sla_mla: String,
                    maintain_visit: String,
                    validate_num_days: String,
                    stock_code:String,
                    stock_qty:String,
                    unit_cost:String,
                    hours: String,
                    product_type: String,
                    equip_margin:String,
                    labour_margin:String,
                    labour_hrs:String,
                    maintenance_hrs:String,
                    supplier: String,
                },
             required:true,
            },
        ]
        },
       required:true,   
    },
],  
})
const users = mongoose.model("data",userSchema);
app.get('/',(req,res)=>{
    res.sendFile( path.join(__dirname,'index.html'))
})
app.post('/post',async(req,res)=>{
    const{saleName,ref_num,descriptions,name,email,cell,role,customer_name,customer_call_person,customer_email, install_difficulty,
        factor,sla_mla,maintain_visit,validate_num_days,bill_title,stock_code,stock_qty,unit_cost,hours,product_type,
        equip_margin,labour_margin,labour_hrs,maintenance_hrs,supplier} = req.body
const user = new users({
    saleName,
    ref_num,
    name ,
    email,
    cell,
    role,
    customer_name,
    customer_call_person,
    customer_email,
    billing: [
        {
        bill_title,
        items: [ {
            descriptions,
            install_difficulty,
            factor,
            sla_mla ,
            maintain_visit,
            validate_num_days,
            stock_code,
            stock_qty,
            unit_cost,
            hours,
            product_type,
            equip_margin,
            labour_margin,
            labour_hrs,
            maintenance_hrs,
            supplier,
           },
        ]
    },
],
})
try {
    await user.save();
    console.log("User data saved successfully:", user);
    res.send("Registration successful");
} catch (err) {
    console.error("Error saving user data:", err);
    res.status(500).send("Error saving user data");
}
});
const collection = new mongoose.model('Quantity',userSchema);
module.exports = collection;
