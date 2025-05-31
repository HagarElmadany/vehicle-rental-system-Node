<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
=======
const express =require('express');
const path = require('path');
const mongoose =require('mongoose');
const cors =require('cors');
const dotenv = require('dotenv');
const carRoutes = require('./routes/carRoutes');

dotenv.config(); // Load environment variables from .env file

>>>>>>> a7292a96467fbe0bc9005c9194e84675b0c105e1

const app = express();
app.use(express.json());
<<<<<<< HEAD
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth', authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
=======
app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars')));

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



// Error handling middleware
app.use((err, req, res, next) => {
    console.log(err);

    res.status(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        message: err.message || 'Something went wrong!',
        errors: []
    })
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
>>>>>>> a7292a96467fbe0bc9005c9194e84675b0c105e1
});
