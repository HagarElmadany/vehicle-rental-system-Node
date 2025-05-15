const express =require('express');
const mongoose =require('mongoose');
const cors =require('cors');
const dotenv = require('dotenv');
const carRoutes = require('./routes/carRoutes');

dotenv.config(); // Load environment variables from .env file


const app = express();
const PORT= process.env.PORT || 5000;


//Middleware
app.use(cors());
app.use(express.json());


//connect to MongoDB
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useUnifiedTopology: true,
})
.then(()=> {console.log('MongoDB connected')})
.catch((err)=> {console.error('MongoDB connection error:', err)});


//routes
app.get('/', (req, res) => {
    res.send('server is working');
})

// cars Routes
app.use('/api/cars', carRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
