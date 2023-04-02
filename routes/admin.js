var express = require('express');
const { ObjectId } = require('mongodb');
const { response } = require('../app');
const session = require('express-session');
var router = express.Router();
var productHelpers=require('../helper/product-helper')
const verifylogdin=(req,res,next)=>{
  if(req.session.logdin){
  next()
}else{
  res.redirect('/admin/admin-login')  
}
}

/* GET users listing. */
router.get('/',verifylogdin,(req, res, next)=>{
 let Admin=req.session.admin
 console.log(Admin);  
  productHelpers.getAllProducts().then((products)=>{
  
    res.render('admin/view-products',{admin:true,products,Admin})
  })
  
  
}); 
router.get('/add-product',verifylogdin,function(req,res){
  res.render('admin/add-product',{admin:true,Admin:req.session.admin});
})
router.post('/add-product',(req,res)=>{
  
 

    productHelpers.addproduct(req.body,(ObjectId)=>{
    let image=req.files.image
    
    image.mv('./public/images/'+ObjectId+'.png',(err)=>{
      if(!err){
      res.render('admin/add-product',{admin:true,Admin:req.session.admin});
      
      }
    })
  
    
    })

      
  })  

  router.get('/delete-product/:id',(req,res)=>{
    let proId=req.params.id
    console.log(proId);
    productHelpers.deleteproducts(proId).then((response)=>{
      res.redirect('/admin/');

    })
  })
  router.get('/edit-product/:id',verifylogdin,async(req,res)=>{
    let product=await productHelpers.getproductDetails(req.params.id)
    
    res.render('admin/edit-product',{admin:true,product,Admin:req.session.admin})

  })
  router.post('/edit-product/:id',verifylogdin,(req,res)=>{
    let id=req.params.id
    productHelpers.updateProduct(req.params.id,req.body).then(()=>{
      res.redirect('/admin')
      if(req.files.image){ 

          let image=req.files.image
        image.mv('./public/images/'+id+'.png')

      }

    })
 
  })
  router.get('/all-orders',verifylogdin,(req,res)=>{
    productHelpers.getAllOrders().then((allOrders)=>{  
    res.render('admin/all-orders',{admin:true,allOrders,Admin:req.session.admin})
  })
  })
  router.get('/deliveryProducts/:id',verifylogdin,async(req,res)=>{
    let products=await productHelpers.getOrderProducts(req.params.id)
    res.render('admin/deliveryProducts',{products,admin:true,Admin:req.session.admin})
  })
  router.get('/user-details',verifylogdin,(req,res)=>{
    
    productHelpers.getAllUsers().then((allUsers)=>{

   
    res.render('admin/user-details',{admin:true,allUsers,Admin:req.session.admin})
    })
  })
  router.get('/admin-login',(req,res)=>{
    if(req.session.logdin){
      res.redirect('/admin')
    }else{
      res.render('admin/admin-login',{admin:true,"loginErr":req.session.loginErr})
      req.session.loginErr=null
    }

     
      

  
  })
  router.post('/admin-login',(req,res)=>{ 
productHelpers.adminLogin(req.body).then((response)=>{
  if(response.status){
    req.session.logdin=true
    req.session.admin=response.admin
      
    res.redirect('/admin')
  }else{
    req.session.loginErr="Invalid username or password"
    res.redirect('/admin/admin-login')
  }
})
console.log(req.body)
  })
  router.get('/admin-logout',(req,res)=>{
    req.session.admin=null
    req.session.logdin=false
    res.redirect('/admin/admin-login')

  })

  
  


module.exports = router;
