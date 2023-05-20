var express = require('express');
const session = require('express-session');
const { OrderedBulkOperation } = require('mongodb');
const { response, defaultConfiguration } = require('../app');
const { getproductDetails } = require('../helper/product-helper');
var router = express.Router();
const productHelpers=require('../helper/product-helper');
const userHelpers=require('../helper/user-helper');
const verifylogin=(req,res,next)=>{
  if(req.session.loggedIn){
  next()
}else{
  res.redirect('/login')  
} 
}

/* GET home page. */

  router.get('/',async function(req, res, next) {
    let user=req.session.user
    let cartCount=null
    if(req.session.user){
   cartCount=await userHelpers.getCartCount(req.session.user._id)
   }
    productHelpers.getAllProducts().then((products)=>{
     
      res.render('user/view-products',{products,user,cartCount})
     
        
    })
    

  })
  router.get('/login',(req,res)=>{
    if(req.session.loggedIn){
     res.redirect('/')
    }else{
      res.render('user/user-login',{'loginErr':req.session.loginErr})
      req.session.loginErr=null
    }
    
  })
  router.get('/signup',(req,res)=>{
    res.render('user/user-signup')
  })

  router.post('/signup',(req,res)=>{
userHelpers.doSignup(req.body).then((response)=>{
  req.session.loggedIn=true
        req.session.user=response
        res.redirect('/')
})
  })
  router.post('/login',(req,res)=>{
    userHelpers.dologin(req.body).then((response)=>{
      if(response.status){
        req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/')

      }else{
        req.session.loginErr="Invalid user name or password"
        res.redirect('/login')
      }
    })
  })
  router.get('/logout',(req,res)=>{
    req.session.user=null
    req.session.loggedIn=false
       res.redirect('/') 
  })
  router.get('/cart',verifylogin,async(req,res)=>{
    let products=await userHelpers.getCartProducts(req.session.user._id)
    let totelValue=await userHelpers.getTotelAmount(req.session.user._id)

    res.render('user/cart',{products,user:req.session.user,totelValue})
     
  })
router.get('/add-to-cart/:id',verifylogin,(req,res)=>{ 

userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
  res.json({status:true})
}) 
})   
router.post('/change-product-quantity',(req,res,next)=>{  
  
userHelpers.changeProductQuantity(req.body).then(async(response)=>{

  res.json(response)
 
  })
}) 
router.post('/delete-Product',(req,res)=>{
  userHelpers.deleteCartProduct(req.body).then((response)=>{
    res.json(response)
  }) 
  
}) 
router.get('/order-place',verifylogin, async(req,res)=>{
  let totel=await userHelpers.getTotelAmount(req.session.user._id)
  res.render('user/order-place',{totel,user:req.session.user})
 
})
router.post('/order-place',async(req,res)=>{
  let totelPrice=await userHelpers.getTotelAmount(req.body.userId)
  let products=await userHelpers.getCartProductList(req.body.userId)
  userHelpers.placeOrder(req.body,products,totelPrice).then((orderId)=>{
    if(req.body['Payment-Methods']==='COD'){
      res.json({codSuccess:true})
    }else{
     userHelpers.genarateRazorpay(orderId,totelPrice).then((response)=>{
       res.json(response)

     })
    }
    
  })  
  console.log(req.body); 
 
 

})
router.get('/order-success',(req,res)=>{
  
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',verifylogin,async(req,res)=>{
  let orders=await userHelpers.getUserOrder(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders}) 
  console.log(orders);
})
router.get('/view-order-Products/:id',verifylogin,async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);  
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment secces")
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
  })
  


module.exports = router  
