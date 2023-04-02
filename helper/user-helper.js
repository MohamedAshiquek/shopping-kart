var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response, routes } = require('../app')
var objectId=require('mongodb').ObjectId
const Razorpay=require('razorpay')
const { resolve } = require('path')
var instance = new Razorpay({
   key_id: 'rzp_test_B2bBX3lw68cNaR',
   key_secret: '4w0ixf1oLFV0Z3V6JQOUKKLO',
  });
module.exports={
    doSignup:(userData)=>{
        return new Promise (async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.insertedId)

            }) 
           

        })

    },
    dologin:(userData)=>{
        return new Promise(async (resolve,reject)=>{
            let loginstatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        
                        resolve({status:false})
                    }
                })

                
            }else{
               
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:new objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId) })
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:new objectId(userId),'products.item':new objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }else{
                 db.get().collection(collection.CART_COLLECTION)
                 .updateOne({user:new objectId(userId)},
                 {
                    
                        $push:{products:proObj}
                 
                 } 
                 ).then((response)=>{
                     resolve()
                 })}

                
                
              

            }else{
                let cartObj={
                    user:new objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'

                },
                {
                    
                    $project:{
                        item:"$products.item",
                        quantity:'$products.quantity'


                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

                
                   
                    
            ]).toArray() 
          
            
            if(cartItems[0]){
               
                resolve(cartItems);
           } else {
                resolve([]);
           }
           

           
           
        })
    },
     getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
     },
     changeProductQuantity:(details)=>{
        details.count=parseInt(details.count);
       

        return new Promise ((resolve,reject)=>{
            
            if(details.count==-1 && details.quantity==1){
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:new objectId(details.cart)},
        {
            $pull:{products:{item:new objectId(details.product)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true}) 
        })
    }else{
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:new objectId(details.cart), 'products.item':new objectId(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }

        ).then((response)=>{
            resolve({status:true})
        })
    }
    })
     
 },
 deleteCartProduct:(details)=>{
    return new Promise((resolve,reject)=>{
 
    
    db.get().collection(collection.CART_COLLECTION)
    .updateOne({_id:new objectId(details.cart)},
    {
        $pull:{products:{item:new objectId(details.product)}}
    }
    ).then((response)=>{
        resolve({removeProduct:true})
    })

})
 },
 getTotelAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
           
        let totel=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:new objectId(userId)}
            },
            {
                $unwind:'$products'

            },
            {
                
                $project:{
                    item:"$products.item",
                    quantity:'$products.quantity'


                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            },
            {
                $group:{
                    _id:null,
                   totel:{$sum:{$multiply:['$quantity',{$toInt:'$product.price'}]}}
                }
            }

            
                
                 
        ]).toArray()   
        if(totel[0]){
            resolve(totel[0].totel)
        }else{
            resolve([])
        }
       
      
       

       
       
      })
    },
    placeOrder:(order,products,totel)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,totel);
            let status=order['Payment-Methods']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    name:order.Name,
                    address:order.Address,
                    mobile:order.Number,
                    email:order.Email

                },
                userId:new objectId(order.userId),
                PaymentMethod:order['Payment-Methods'],
                products:products,
                totelAmound:totel, 
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:new objectId(order.userId)})
                console.log("insertedId"+response.insertedId);
                
                resolve(response.insertedId)
              
                
            })

        })

    },
    getCartProductList:(userId)=>{  
        return new Promise(async(resolve,reject)=>{
            
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            resolve(cart.products);
        })  
    },
    getUserOrder:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId);
            let orders=await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:new objectId(userId)}).toArray()
            
            resolve(orders)
            
        })

    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
          
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new objectId(orderId)}
                },
                {
                    $unwind:'$products'

                },
                {
                    
                    $project:{
                        item:"$products.item",
                        quantity:'$products.quantity'


                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

                
                   
                    
            ]).toArray() 
          
            
                resolve(orderItems)
                
           
           
        })
    },
    genarateRazorpay:(orderId,totel)=>{
        console.log(orderId);
        return new Promise((resolve,reject)=>{
        var options ={
            amount:totel*100,
            currency: "INR", 
            receipt:""+orderId
        };
        instance.orders.create(options,function(err,order){
            console.log("New order",order);
            resolve(order)
        })
 
        })
    },
     verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto');
            let hmac=crypto.createHmac('sha256','4w0ixf1oLFV0Z3V6JQOUKKLO')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }

 }




