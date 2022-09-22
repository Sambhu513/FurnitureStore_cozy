const ProductStore = require("../Connections/AdminSchema").Products;
const MongoCategory = require("../Connections/AdminSchema").MainCategory;
const MongoCart = require("../Connections/UserSchema").CartData;
const MongoOrder = require("../Connections/UserSchema").OrderDetails;
const MongoUser = require("../Connections/UserSchema").user_data;
const MongoAddress=require("../Connections/UserSchema").address
const session = require("express-session");
const { ObjectId } = require("mongodb");
const { json } = require("body-parser");
const { address } = require("../Connections/UserSchema");
const { query } = require("express");

const CategoryList = async () => {
  return await MongoCategory.find();
};

const MainProfile = async (req, res) => {
  const user = await MongoUser.findOne({ email: req.session.user });
  const UserOrder = await MongoOrder.find({ userId: user._id });

const Address=await MongoAddress.find({UserId:user._id})
  console.log(Address);
  res.render("user/User-profile", {
    Category: await CategoryList(),
    Orders: UserOrder,
    user:user,
    address:Address
  });
};

const SingleOrder = async (req, res) => {
  const OrderID = req.query.orderid;

  const orderDetails = await MongoOrder.findOne({ _id: ObjectId(OrderID) });

  const ProductDetails = await MongoOrder.aggregate([
    { $match: { _id: ObjectId(OrderID) } },
    { $unwind: "$products" },
    {
      $project: { ItemId: "$products.ItemId", Quantity: "$products.Quantity" },
    },
    {
      $lookup: {
        from: "productdetails",
        localField: "ItemId",
        foreignField: "_id",
        as: "productdata",
      }
    },{$project:{Quantity: 1,product: { $arrayElemAt: ['$productdata',0]}}}

  ]);
  console.log(orderDetails);

  res.render("user/YourOrders", { Category: await CategoryList(),productdata:ProductDetails,orderDetails:orderDetails });
};

const cancelOrder=async(req,res)=>
{
console.log("what i want",req.body);


const details=await MongoOrder.findOne({_id:ObjectId(req.body.id)})

if(details.paymentMethod=="COD")
{
await MongoOrder.updateOne({_id:ObjectId(req.body.id)},{$set:{CancelOrder:1,DeliveryStatus:"canceled",PaymentStatus:"canceled"}},function(err,success)

{
if(success)
{
console.log(success);
}

}).clone()
}
else
{
await MongoOrder.updateOne({_id:ObjectId(req.body.id)},{$set:{CancelOrder:1,DeliveryStatus:"canceled",PaymentStatus:"refund initiated"}},function(err,success)

{
if(success)
{
console.log(success);
}

}).clone()
}
console.log(await MongoOrder.findOne({_id:ObjectId(req.body.id)}));
res.json(true)

}

const SaveAddress=async (req,res)=>
{

  const user =await MongoUser.findOne({email:req.session.user});
  console.log(user);
  // console.log(req.body);

console.log(await MongoAddress.findOne({address:req.body}));
if(await MongoAddress.findOne({address:req.body}))
{
  res.json("false")

}
else
{
const address=new MongoAddress
({
  UserId:user._id,
  address:req.body
})
address.save()
res.json("true")
}
}
const ReturnProduct=(req,res)=>
{
  console.log(req.body);
  MongoOrder.updateOne({_id:ObjectId(req.body.orderid)},{$set:{CancelOrder:1,DeliveryStatus:"canceled",PaymentStatus:"refund initiated"}},(s,e)=>
  {
    if(s)
    console.log(s);
    else
    console.log(e);
  })
res.json(true)
}

const addreessdelete=async (req,res)=>
{
console.log(req.body);

await MongoAddress.remove({_id:ObjectId(req.body.addressid) })

res.json(true)
}
const addressEditer=async(req,res)=>
{

const Address=await MongoAddress.findOne({_id:ObjectId(req.query.addressid)})
console.log(Address);

res.render("user/EditAddress" ,{ Category: await CategoryList(),Address:Address.address,id:Address})

}


const updateaddress=async (req,res)=>
{

  console.log(req.body);
await MongoAddress.updateOne({_id:ObjectId(req.body.addressid)},{'address.firstname':req.body.firstname,'address.lastname':req.body.lastname,'address.address':req.body.address,'address.country':req.body.country,'address.city':req.body.city,'address.state':req.body.state,'address.postcode':req.body.postcode,'address.phone':req.body.phone,'address.email':req.body.email,'address.extra':req.body.extra})
res.json(true)
}



const wishlistView=async (req,res)=>
{
res.render("user/WishList",{ Category: await CategoryList()})


}













module.exports = {
  SingleOrder,
  MainProfile,
  cancelOrder,
  SaveAddress,
  ReturnProduct,
  addreessdelete,
  addressEditer,
  updateaddress,
  wishlistView
};
