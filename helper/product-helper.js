var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId
const bcrypt=require('bcrypt')

const { response } = require('../app')
//const { default: orders } = require('razorpay/dist/types/orders')


module.exports={

    addproduct:(product,callback)=>{
        
        db.get().collection('product').insertOne(product).then((data)=>{
            
            callback(data.insertedId)
            
       })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })
    },
    deleteproducts:(proId)=>{
        return new Promise((resolve,reject)=>{
           
            
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(proId)}).then((response)=>{
                resolve(response);
               
            })
        })    
    },
    getproductDetails:(proId)=>{
       return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(proId)}).then((product)=>{
            resolve(product)
        })
       })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:new objectId(proId)},{
                $set:{
                    name:proDetails.name,
                    discreption:proDetails.discreption,
                    price:proDetails.price,
                    catogory:proDetails.catogory
                }
             }).then((response)=>{
                resolve()
             })
        })
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
        let allOrders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
        resolve(allOrders)
        console.log(allOrders);
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
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
        let allUsers=await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(allUsers)
        console.log(allUsers);
        })
    },
    // addAdminLogin:()=>{
    //     let adminSet={password:'12345',username:'ashique'}
    //     return new Promise(async(resolve,reject)=>{
            
    //         adminSet.password=await bcrypt.hash(adminSet.password,10)
    //         db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminSet).then((data)=>{
    //             resolve(data)
    //             console.log(data);
    //         })
    //     })
    // },
    adminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginstatus=false
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({username:adminData.username})
            if(admin){
                bcrypt.compare(adminData.Password,admin.password).then((status)=>{
                    if(status){
                        console.log('login success')
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('login filed')
                        resolve({status:false})
                    }
                })

               
            }else{
                console.log('login filed')
                resolve({status:false})
            }
    
            
        })
    }

    
}