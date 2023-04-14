const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const ObjectId = require("mongodb").ObjectId;


app.use(bodyParser.json({ limit: '1mb' }));

app.use(fileUpload());

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://accounting_service:3zq2u6aDn2YjtAcr@cluster0.ugczoqc.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ugczoqc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("accounting_service").collection("services");
    const ordersCollection = client.db("accounting_service").collection("orders");
    const reviewCollection = client.db("accounting_service").collection("review");
    const adminCollection = client.db("accounting_service").collection("admin");

    //get all services
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //get request for all orders
   
    //   app.get("/orders", async (req, res) => {
    //     const query = {};
    //     const cursor = ordersCollection.find(query);
    //     const orders = await cursor.toArray();
    //     res.send(orders);
    //   });


      app.get('/orders', async(req, res)=>{
        const loggedUser = req.query.loggedUser;
        const query = {email:loggedUser};
        const result = await ordersCollection.find(query).toArray();
          res.send(result)
        
      })
      app.get('/isAdmin', async(req, res)=>{
      
        const loggedUser = req.query.loggedUser;
        
       console.log(loggedUser);
        const query = {email:loggedUser};
        const result = await adminCollection.find(query).toArray();
        console.log(result);
          res.send(result)
        
      })

      // app.get("/isAdmin", (req, res) => {
      //   const email = req.body.email;
      //   console.log(email);
      //   adminCollection.find({ email: email }).toArray((err, admin) => {
      //     res.send(admin.length > 0);
      //   });
      // });


     //Patch request for updating information
     
     //update API for OrderInfoCollection
    app.patch('/updateStatusForOrders/:id',async(req, res)=>{
        const id = req.params.id;
        const newStatus = req.body.status;
        const filter = {_id: new ObjectId(id)};
        const option = {upsert:true};
        const updateDoc ={
          $set:{status:newStatus}
        };
  
        const result = await ordersCollection.updateOne(filter,updateDoc,option);
  
        let finalRes
        if(result.modifiedCount){
          const query= {};
          const cursor = ordersCollection.find(query);
          const updatedResult = await cursor.toArray();
          finalRes = {data:updatedResult, success:true, message:'Data Successfully Updated'}
        }
        else{
          finalRes = {data:[], success:false, message:'Something Went wrong'}
        }
     res.send({result: finalRes})
      })



      app.post("/addReview", (req, res) => {
        const review = req.body;
    
        console.log("review", review);
    
         reviewCollection.insertOne(review).then((result) => {
          res.send(result.acknowledged);
        });
      });

      app.post("/addAdmin", (req, res) => {
        const admin = req.body;
        console.log(admin);
        adminCollection.insertOne(admin).then((result) => {
          res.send(result.acknowledged);
        });
      });


      app.delete("/delete/:id", (req, res) => {
        serviceCollection
          .deleteOne({ _id: new ObjectId(req.params.id) })
          .then((result) => {
            res.send(result.deletedCount > 0);
          });
      });




    //create a post request for adding order

    app.post("/addOrder", (req, res) => {
        const orders = req.body;
        ordersCollection.insertOne(orders).then((result) => {
          res.send(result.acknowledged);
        });
      });

    // create a post request for service

    app.post("/addService", (req, res) => {
      const file = req.files.file;
      const name = req.body.name;
      const description = req.body.description;
      const price = req.body.price;
      const newImg = file.data;
      const encImg = newImg.toString("base64");

      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };
      console.log(image);
      serviceCollection
        .insertOne({ name, description, image, price })
        .then((result) => {
          res.send(result.acknowledged);
          // res.send(result.insertedCount > 0);
        });
    });

   


  } 
  
  
  finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Accounting-service");
});
app.listen(port, () => {
  console.log(`Accounting-service app listening on port ${port}`);
});
