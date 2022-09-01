const mongoConnection = require("../Connections/UserSchema");
const bcrypt = require("bcrypt");
const session = require("express-session");
// const { MainCategory } = require("../Connections/AdminSchema");
const UserHelper = require("../Helper-User/UserRegister_helper");
const { response } = require("express");
const { ObjectId } = require("mongodb");
const { json } = require("body-parser");
const CC = require("currency-converter-lt");
const Razorpay=require('razorpay')
const crypto=require("crypto")
const {
  TrustProductsChannelEndpointAssignmentContext,
} = require("twilio/lib/rest/trusthub/v1/trustProducts/trustProductsChannelEndpointAssignment");
const {
  ModelBuildContext,
} = require("twilio/lib/rest/autopilot/v1/assistant/modelBuild");
const ProductStore = require("../Connections/AdminSchema").Products;
const MongoCategory = require("../Connections/AdminSchema").MainCategory;
const MongoCart = require("../Connections/UserSchema").CartData;
const MongoUserData = require("../Connections/UserSchema").user_data;
const MongoAddress = require("../Connections/UserSchema").address;

var instance = new Razorpay({
  key_id: process.env.KEY_ID, 
  key_secret: process.env.KEY_SECRET,
});



const paypal = require('paypal-rest-sdk');
 
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AQVcB0br1h3w35WAI6TnvZ1YWo5tb4MAQsnPWC03HS4Ablcy6yY7M9dJ6GsWdPSFxzYv7Dzj6JZVffOb',
  'client_secret': 'EFZcTQfiBEyN2w_p1TpChtgkakULbuHfYvGMWyUwsk8OCvACXZqo8AsCAWCPR_jTXiUHHrpPH0ooZVqo'
});
 


const CategoryList = async () => {

    
  return await MongoCategory.find();
};


const OrderCheckout = async (req, res) => {

console.log('im here');
  console.log(req.body);
    req.session.address=req.body
  const UserId = await MongoUserData.findOne({ email: req.session.user });
  cartDetails = await MongoCart.findOne({ UserId: UserId._id });

  var CartProduct = await MongoCart.aggregate([
    { $match: { UserId: UserId._id } },
    { $unwind: "$product" },
    { $project: { ItemId: "$product.ItemId", Quantity: "$product.Quantity" } },
    {
      $lookup: {
        from: "productdetails",
        localField: "ItemId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $project: {
        ItemId: 1,
        Quantity: 1,
        product: { $arrayElemAt: ["$product", 0] },
      },
    },
  ]);

  let TotalPrice = 0, TotalQuantity=0;

  CartProduct.forEach(function (CartItems) {
    TotalPrice =
    TotalPrice +
   ( CartItems.Quantity * (CartItems.product.Price -
    (CartItems.product.Price * CartItems.product.Discount) / 100));
    TotalQuantity=TotalQuantity+ CartItems.Quantity
  });


  // console.log(user);

  const details = req.body;
  // console.log(details);
  const Address = {
    Name: details.FirstName + " " + details.LastName,
    Mobile: details.phone,
    Email: details.email,
    Address: details.Address,
    Country: details.Country,
    State: details.State,
    City: details.City,
    Zip: details.zip,
    additional: details.additional,
  };

  const user = await mongoConnection.user_data.findOne({
    email: req.session.user,
  });
  // console.log(user._id);
  // console.log(await MongoCart.find({UserId:user._id}));

  // console.log(Address);
  const ProductData = await MongoCart.aggregate([
    { $match: { UserId: user._id } },
    { $unwind: "$product" },
    {
      $project: {
        ItemId: "$product.ItemId",
        Quantity: "$product.Quantity",
        _id: 0,
      },
    },
  ]);

  if (details.delivery == "COD") {
    const OrderDetails = new mongoConnection.OrderDetails({
      DeliveryDetails: Address,

      userId: user._id,
      date: new Date().toDateString(),
      realDate: new Date(),
      products: ProductData,
      status: "Order Placed",
      PaymentMethode: details.delivery,
      PaymentStatus: "pending",
      DeliveryStatus: "pending",
      TotalAmount: Math.trunc(TotalPrice),
      TotalQuantity:TotalQuantity,
      paymentMethod: "COD",
      CancelOrder: 0,
    });
    OrderDetails.save(function (err, room) {
      var newRoomId = room._id;

      // console.log("room",newRoomId);
    });

    await MongoCart.deleteOne({ UserId: user._id }, function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log(success);
      }
    }).clone();


    res.json( {
      name:"COD",
      id:OrderDetails._id,
    total:TotalPrice})

    // res.render("user/OrderPlaced", {
    //   Category: await CategoryList(),
    //   orderID: OrderDetails._id,
    // });
  } 
  
  
  
//   paypal........................
  
  


  else if (details.delivery == "Paypal") {

res.json({name:"paypal",
total:TotalPrice})


//     const UserId = await MongoUserData.findOne({ email: req.session.user });
//     cartDetails = await MongoCart.findOne({ UserId: UserId._id });
  
//     var CartProduct = await MongoCart.aggregate([
//       { $match: { UserId: UserId._id } },
//       { $unwind: "$product" },
//       { $project: { ItemId: "$product.ItemId", Quantity: "$product.Quantity" } },
//       {
//         $lookup: {
//           from: "productdetails",
//           localField: "ItemId",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       {
//         $project: {
//           ItemId: 1,
//           Quantity: 1,
//           product: { $arrayElemAt: ["$product", 0] },
//         },
//       },
//     ]);
  
//     let TotalPrice = 0;
  
//     CartProduct.forEach(function (CartItems) {
//       TotalPrice =
//         TotalPrice +
//         CartItems.Quantity * CartItems.product.Price -
//         (CartItems.product.Price * CartItems.product.Discount) / 100;
//     });


// console.log(TotalPrice)
//     let amountToConvert = TotalPrice;
//  Math.trunc(TotalPrice)
//     let currencyConverter = new CC({from:"INR", to:"USD",amount:1000});
//    const paymamount= Math.round(await currencyConverter.from("INR").to("USD").amount( Math.trunc(TotalPrice)).convert())
// console.log("inhere",paymamount);


//     const create_payment_json = {
//         "intent": "sale",
//         "payer": {
//             "payment_method": "paypal"
//         },
//         "redirect_urls": {
//             "return_url": "http://localhost:3000/OrderSuccess",
//             "cancel_url": "http://localhost:3000/OrderFailed"
//         },
//         "transactions": [{
//             "item_list": {
//                 "items": [{
//                     "name": "Red Sox Hat",
//                     "sku": "001",
//                     "price": paymamount  ,
//                     "currency": "USD",
//                     "quantity": 1
//                 }]
//             },
//             "amount": {
//                 "currency": "USD",
//                 "total":  paymamount
//             },
//             "description": "Hat for the best team ever"
//         }]
//     };
     
//     paypal.payment.create(create_payment_json, function (error, payment) {
//       if (error) {
//           throw error;
//       } else {
//           for(let i = 0;i < payment.links.length;i++){
//             if(payment.links[i].rel === 'approval_url'){

//                 console.log(payment.links[i]);
//               res.redirect(payment.links[i].href);
//             }
//           }
//       }
//     });
     



  }


// razerpay..................
else if (details.delivery == "RazerPAy") {
  var options = {
    amount: Math.round(TotalPrice)*100,
    currency: "INR",
    receipt: "rcp1",
    notes: {
        key1: "razerpay",
        key2: "value2"
    }
}
console.log('fwisdv');
instance.orders.create(options, function(err, order) {
    if (err) {
        console.log('error',err);
    }else {
        console.log("New Order",order);
        res.json(order);
    }
})



  
  // res.json({name:"razerpay",
  // total:TotalPrice})

}





};

const PaypalOrderPlaced=async(req,res)=>
{

    const UserId = await MongoUserData.findOne({ email: req.session.user });
    cartDetails = await MongoCart.findOne({ UserId: UserId._id });
  
    var CartProduct = await MongoCart.aggregate([
      { $match: { UserId: UserId._id } },
      { $unwind: "$product" },
      { $project: { ItemId: "$product.ItemId", Quantity: "$product.Quantity" } },
      {
        $lookup: {
          from: "productdetails",
          localField: "ItemId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          ItemId: 1,
          Quantity: 1,
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
    ]);
  
    let TotalPrice = 0, TotalQuantity=0 ;
  
    CartProduct.forEach(function (CartItems) {
      TotalPrice =
      TotalPrice +
     ( CartItems.Quantity * (CartItems.product.Price -
      (CartItems.product.Price * CartItems.product.Discount) / 100));
      TotalQuantity=TotalQuantity+ CartItems.Quantity
    });
  


    
    const details = req.session.address;

    const Address = {
      Name: details.FirstName + " " + details.LastName,
      Mobile: details.phone,
      Email: details.email,
      Address: details.Address,
      Country: details.Country,
      State: details.State,
      City: details.City,
      Zip: details.zip,
      additional: details.additional,
    };

    const user = await mongoConnection.user_data.findOne({
        email: req.session.user,
      });
      // console.log(user._id);
      // console.log(await MongoCart.find({UserId:user._id}));
    
      // console.log(Address);
      const ProductData = await MongoCart.aggregate([
        { $match: { UserId: user._id } },
        { $unwind: "$product" },
        {
          $project: {
            ItemId: "$product.ItemId",
            Quantity: "$product.Quantity",
            _id: 0,
          },
        },
      ]);

      const OrderDetails = new mongoConnection.OrderDetails({
        DeliveryDetails: Address,
  
        userId: user._id,
        date: new Date().toDateString(),
        realDate: new Date(),
        products: ProductData,
        status: "Order Placed",
        PaymentMethode: details.delivery,
        PaymentStatus: "Success",
        DeliveryStatus: "pending",
        TotalAmount: Math.trunc(TotalPrice),
        paymentMethod: "PayPal",
        TotalQuantity:TotalQuantity,
        CancelOrder: 0,
      });
      OrderDetails.save(function (err, room) {
        var newRoomId = room._id;
  
        // console.log("room",newRoomId);
      });
  
      await MongoCart.deleteOne({ UserId: user._id }, function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log(success);
        }
      }).clone();
  
  
      res.render("user/OrderPlaced", {
        Category: await CategoryList(),
        orderID: OrderDetails._id,
      });
    


      
}

const paypalhelp=async(req,res)=>
{
  
  const UserId = await MongoUserData.findOne({ email: req.session.user });
  cartDetails = await MongoCart.findOne({ UserId: UserId._id });

  var CartProduct = await MongoCart.aggregate([
    { $match: { UserId: UserId._id } },
    { $unwind: "$product" },
    { $project: { ItemId: "$product.ItemId", Quantity: "$product.Quantity" } },
    {
      $lookup: {
        from: "productdetails",
        localField: "ItemId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $project: {
        ItemId: 1,
        Quantity: 1,
        product: { $arrayElemAt: ["$product", 0] },
      },
    },
  ]);

  let TotalPrice = 0;

  CartProduct.forEach(function (CartItems) {
    TotalPrice =
    TotalPrice +
   ( CartItems.Quantity * (CartItems.product.Price -
    (CartItems.product.Price * CartItems.product.Discount) / 100));
  });


console.log(TotalPrice)
  let amountToConvert = TotalPrice;
Math.trunc(TotalPrice)
  let currencyConverter = new CC({from:"INR", to:"USD",amount:1000});
 const paymamount= Math.round(await currencyConverter.from("INR").to("USD").amount( Math.trunc(TotalPrice)).convert())
console.log("inhere",paymamount);


  const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/OrderSuccess",
          "cancel_url": "http://localhost:3000/OrderFailed"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": "Red Sox Hat",
                  "sku": "001",
                  "price": paymamount  ,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total":  paymamount
          },
          "description": "Hat for the best team ever"
      }]
  };
   
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){

              console.log(payment.links[i]);
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
   


}


const razorpayhelp=async(req,res)=>
{
console.log(req.body);
  let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);
  hmac.update(req.body.payment.razorpay_order_id+'|'+req.body.payment.razorpay_payment_id);
  hmac = hmac.digest('hex')


console.log("hmac is",hmac);

  
if(hmac==req.body.payment.razorpay_signature){
  res.json({status:true})
}else{

  res.json({status: false,errMsg:''})
}
}


const razersuccess=async (req,res)=>
{


  const UserId = await MongoUserData.findOne({ email: req.session.user });
  cartDetails = await MongoCart.findOne({ UserId: UserId._id });

  var CartProduct = await MongoCart.aggregate([
    { $match: { UserId: UserId._id } },
    { $unwind: "$product" },
    { $project: { ItemId: "$product.ItemId", Quantity: "$product.Quantity" } },
    {
      $lookup: {
        from: "productdetails",
        localField: "ItemId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $project: {
        ItemId: 1,
        Quantity: 1,
        product: { $arrayElemAt: ["$product", 0] },
      },
    },
  ]);

  let TotalPrice = 0, TotalQuantity=0;

  CartProduct.forEach(function (CartItems) {
    TotalPrice =
    TotalPrice +
   ( CartItems.Quantity * (CartItems.product.Price -
    (CartItems.product.Price * CartItems.product.Discount) / 100));
    TotalQuantity=TotalQuantity+ CartItems.Quantity
  });



  
  const details = req.session.address;

  const Address = {
    Name: details.FirstName + " " + details.LastName,
    Mobile: details.phone,
    Email: details.email,
    Address: details.Address,
    Country: details.Country,
    State: details.State,
    City: details.City,
    Zip: details.zip,
    additional: details.additional,
  };

  const user = await mongoConnection.user_data.findOne({
      email: req.session.user,
    });
    // console.log(user._id);
    // console.log(await MongoCart.find({UserId:user._id}));
  
    // console.log(Address);
    const ProductData = await MongoCart.aggregate([
      { $match: { UserId: user._id } },
      { $unwind: "$product" },
      {
        $project: {
          ItemId: "$product.ItemId",
          Quantity: "$product.Quantity",
          _id: 0,
        },
      },
    ]);

    const OrderDetails = new mongoConnection.OrderDetails({
      DeliveryDetails: Address,

      userId: user._id,
      date: new Date().toDateString(),
      realDate: new Date(),
      products: ProductData,
      status: "Order Placed",
      PaymentMethode: details.delivery,
      PaymentStatus: "Success",
      DeliveryStatus: "pending",
      TotalAmount: Math.trunc(TotalPrice),
      paymentMethod: "RazorPay",
      TotalQuantity:TotalQuantity,
      CancelOrder: 0,

    });
    OrderDetails.save(function (err, room) {
      var newRoomId = room._id;

      // console.log("room",newRoomId);
    });

    await MongoCart.deleteOne({ UserId: user._id }, function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log(success);
      }
    }).clone();


    res.render("user/OrderPlaced", {
      Category: await CategoryList(),
      orderID: OrderDetails._id,
    });
  



}



module.exports = {
  OrderCheckout,
  PaypalOrderPlaced,
  paypalhelp, 
  razorpayhelp,
  razersuccess
};
