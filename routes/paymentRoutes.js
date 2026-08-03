const express=require("express");
const router=express.Router();

const Payment=require("../models/Payment");

// Get all payments

router.get("/",async(req,res)=>{

    try{

        const payments=await Payment.find().sort({paymentDate:-1});

        res.json(payments);

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

module.exports=router;