const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Quantity', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Database connected successfully');
}).catch((err) => {
  console.error('Database connection error:', err);
});

const priceSchema = new mongoose.Schema({
  scPrice: Number,
  pmPrice: Number,
  icPrice: Number
});

const Price = mongoose.model('Price', priceSchema);

// Define schemas and models
const salePeopleSchema = new mongoose.Schema({saleName: String});
const SalePeopleType = mongoose.model('salePeople', salePeopleSchema);

const validateNumTypeSchema = new mongoose.Schema({ validate_num_days: String });
const ValidateNumType = mongoose.model('ValidateNumType', validateNumTypeSchema);

const slaMlaTypeSchema = new mongoose.Schema({ sla_mla: String });
const SlaMlaType = mongoose.model('SlaMlaType', slaMlaTypeSchema);

const installDifficultyTypeSchema = new mongoose.Schema({ install_difficulty: String });
const InstallDifficultyType = mongoose.model('InstallDifficultyType', installDifficultyTypeSchema);

const productTypeSchema = new mongoose.Schema({ Description: String });
const ProductType = mongoose.model('ProductType', productTypeSchema);

const supplyTypeSchema = new mongoose.Schema({ supplier: String });
const SupplyType = mongoose.model('SupplyType', supplyTypeSchema);

const userSchema = new mongoose.Schema({
  ref_num: String, saleName: String, email: String, cell: String, role: String, customer_name: String, customer_call_person: String,customer_email: String,
  billing: [{
    bill_title: String,
   
    items:[ {
      descriptions: String, install_difficulty: String, sla_mla: String, maintain_visit: String, validate_num_days: String, stock_code: String, stock_qty: String, 
      unit_cost: String,
      product_type: String,
      equip_margin: String,
      labour_margin: String,
      labour_hrs: String,
      maintenance_hrs: String,
      supplier: String,
  }]
  }],
});
const User = mongoose.model('User', userSchema);

app.get('/', async (req, res) => {
  try {
    const salePeoples = await SalePeopleType.find();
    res.render('login', { salePeoples }); 
  } catch (err) {
    console.error('Error fetching data for login:', err);
    res.status(500).send('Error fetching data for login');
  }
});

app.get('/signup', async (req, res) => {
  try {
   
    const salePeoples = await SalePeopleType.find();
    const validateNumTypes = await ValidateNumType.find();
    const slaMlaTypes = await SlaMlaType.find();
    const installDifficultyTypes = await InstallDifficultyType.find();
    const productTypes = await ProductType.find();
    const supplyTypes = await SupplyType.find();

    res.render('signup', {
      validateNumTypes, slaMlaTypes, installDifficultyTypes, productTypes, supplyTypes,salePeoples,
    });
  } catch (err) {
    console.error('Error fetching data for signup:', err);
    res.status(500).send('Error fetching data for signup');
  }
});

app.post('/signup', async (req, res) => {
  const billingData = {
    bill_title: req.body.bill_title,
    
    items: {
      descriptions: req.body.descriptions, install_difficulty: req.body.install_difficulty, sla_mla: req.body.sla_mla,maintain_visit: req.body.maintain_visit,
    validate_num_days: req.body.validate_num_days,
      stock_code: req.body.stock_code,
      stock_qty: req.body.stock_qty,
      unit_cost: req.body.unit_cost,
      product_type: req.body.product_type,
      equip_margin: req.body.equip_margin,
      labour_margin: req.body.labour_margin,
      labour_hrs: req.body.labour_hrs,
      maintenance_hrs: req.body.maintenance_hrs,
      supplier: req.body.supplier,
    }
  
  };

  try {
    const existingUser = await User.findOne({ ref_num: req.body.ref_num });
    if (existingUser) {
      existingUser.billing.push(billingData);
      await existingUser.save();
      console.log('New billing entry added successfully:', billingData);
    } else {
      const userData = {
        ref_num: req.body.ref_num,
        saleName: req.body.saleName,
        descriptions: req.body.descriptions,
        email: req.body.email,
        cell: req.body.cell,
        role: req.body.role,
        customer_name: req.body.customer_name,
        customer_call_person: req.body.customer_call_person,
        customer_email: req.body.customer_email,
        billing: [billingData],
      };
      await User.create(userData);
      console.log('User data saved successfully:', userData);
    }
    res.redirect('/');
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).send('Error signing up');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { ref_num, saleName } = req.body;
    
    const user = await User.findOne({ ref_num, saleName });
    
    if (!user) {
      res.send('User not found');
      return;
    }
    
    res.render('home', { user, billing: user.billing });
    
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});

app.get('/updateBilling/:userId/:billingIndex', async (req, res) => {
  try {
    const { userId, billingIndex } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send('Invalid user ID');
    }
    if (isNaN(billingIndex) || billingIndex < 0) {
      return res.status(400).send('Invalid billing index');
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).send('User not found');
    }

    const billing = user.billing[billingIndex];
    if (!billing) {
      return res.status(404).send('Billing entry not found');
    }

    res.render('updateBilling', { user, billing, billingIndex });
  } catch (error) {
    console.error('Error loading update page:', error);
    res.status(500).send('Error loading update page');
  }
});

app.post('/updateBilling/:userId/:billingIndex', async (req, res) => {
  try {
    const { userId, billingIndex } = req.params;
    const { bill_title, items } = req.body;

    if (!bill_title || typeof bill_title !== 'string') {
      return res.status(400).send('Missing or invalid billing title');
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send('Missing or invalid items array');
    }

    for (const [index, item] of items.entries()) {
      const {
        descriptions,
        install_difficulty,
        sla_mla,
        maintain_visit,
        validate_num_days,
        stock_code,
        stock_qty,
        unit_cost,
        product_type,
        equip_margin,
        labour_margin,
        labour_hrs,
        maintenance_hrs,
        supplier
      } = item;

      if (!install_difficulty || !sla_mla || !maintain_visit || !validate_num_days ||
          !stock_code || stock_qty || !unit_cost || !product_type ||
          !equip_margin || !labour_margin || !labour_hrs || !maintenance_hrs || !supplier || !descriptions) {
        return res.status(400).send(`Missing required fields in item at index ${index}`);
      }
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send('Invalid user ID');
    }
    if (isNaN(billingIndex) || billingIndex < 0) {
      return res.status(400).send('Invalid billing index');
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).send('User not found');
    }

    const billing = user.billing[billingIndex];
    if (!billing) {
      return res.status(404).send('Billing entry not found');
    }

    billing.bill_title = bill_title;

    billing.items = items.map((item) => ({
      descriptions: item.descriptions,
      install_difficulty: item.install_difficulty,
      sla_mla: item.sla_mla,
      maintain_visit: item.maintain_visit,
      validate_num_days: item.validate_num_days,
      stock_code: item.stock_code,
      stock_qty: item.stock_qty,
      unit_cost: item.unit_cost,
      product_type: item.product_type,
      equip_margin: item.equip_margin,
      labour_margin: item.labour_margin,
      labour_hrs: item.labour_hrs,
      maintenance_hrs: item.maintenance_hrs,
      supplier: item.supplier
    }));

    await user.save();

    res.redirect('/');
  } catch (error) {
    console.error('Error updating billing:', error.message);
    res.status(500).send(`Error updating billing: ${error.message}`);
  }
});

app.get('/', async (req, res) => {
  try {
   
    const users = await User.find({});

    res.render('home', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error loading home page');
  }
});

app.get('/addQuote', async (req, res) => {
    try {
    
      const salePeoples = await SalePeopleType.find();
        const validateNumTypes = await ValidateNumType.find();
        const slaMlaTypes = await SlaMlaType.find();
        const installDifficultyTypes = await InstallDifficultyType.find();
        const productTypes = await ProductType.find();
        const supplyTypes = await SupplyType.find();
        
        res.render('addQuote', { 
            salePeoples, validateNumTypes, slaMlaTypes, 
            installDifficultyTypes, productTypes, supplyTypes 
        });
    } catch (error) {
        console.error("Error rendering addQuote page:", error);
        res.status(500).send("Server Error");
    }
});

app.post('/addQuote', async (req, res) => {
    try {
        const ref_num = req.body.ref_num;
        const user = await User.findOne({ ref_num });
        if (!user) {
            res.status(404).send('User with the specified ref_num not found.');
            return;
        }
        const billingData = {
            bill_title: req.body.bill_title,
            
            items: {
              descriptions: req.body.descriptions,
              install_difficulty: req.body.install_difficulty,
            sla_mla: req.body.sla_mla,
            maintain_visit: req.body.maintain_visit,
            validate_num_days: req.body.validate_num_days,
                stock_code: req.body.stock_code,
                stock_qty: req.body.stock_qty,
                unit_cost: req.body.unit_cost,
                product_type: req.body.product_type,
                equip_margin: req.body.equip_margin,
                labour_margin: req.body.labour_margin,
                labour_hrs: req.body.labour_hrs,
                maintenance_hrs: req.body.maintenance_hrs,
                supplier: req.body.supplier
            }
        };
        user.billing.push(billingData);
        await user.save();
        console.log("Billing data added successfully to user:", user);
        res.redirect('/');
    } catch (error) {
        console.error("Error adding quote:", error);
        res.status(500).send("Server Error");
    }
});

app.post('/addItem', async (req, res) => {
  try {
      const { ref_num, bill_title } = req.body;

      const user = await User.findOne({ ref_num });
      if (!user) {
          res.status(404).send('User with the specified ref_num not found.');
          return;
      }

      const billingEntry = user.billing.find(billing => billing.bill_title === bill_title);
      if (!billingEntry) {
          res.status(404).send('Billing entry with the specified bill_title not found.');
          return;
      }

      const newItem = {
        descriptions: req.body.descriptions,
          install_difficulty: req.body.install_difficulty,
          sla_mla: req.body.sla_mla,
          maintain_visit: req.body.maintain_visit,
          validate_num_days: req.body.validate_num_days,
          stock_code: req.body.stock_code,
          stock_qty: req.body.stock_qty,
          unit_cost: req.body.unit_cost,
          product_type: req.body.product_type,
          equip_margin: req.body.equip_margin,
          labour_margin: req.body.labour_margin,
          labour_hrs: req.body.labour_hrs,
          maintenance_hrs: req.body.maintenance_hrs,
          supplier: req.body.supplier
      };

      billingEntry.items.push(newItem);

      await user.save();

      console.log("Item added successfully to billing entry:", billingEntry);
      res.redirect('/');

  } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).send("Server Error");
  }
});

app.post('/deleteBilling/:userId/:billingIndex', async (req, res) => {
  try {
      const { userId, billingIndex } = req.params;
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).send('User not found');
      }

      user.billing.splice(billingIndex, 1);

      await user.save();

      res.redirect('/');
  } catch (error) {
      console.error('Error deleting billing entry:', error);
      res.status(500).send('Error deleting billing entry');
  }
});


app.post('/deleteItem/:userId/:billingIndex/:itemIndex', async (req, res) => {
  try {
      const { userId, billingIndex, itemIndex } = req.params;
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).send('User not found');
      }

      user.billing[billingIndex].items.splice(itemIndex, 1);

      await user.save();

      res.redirect('/');
  } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).send('Error deleting item');
  }
});

app.get('/printAllBilling', async (req, res) => {
  try {
    const users = await User.find();
    const billingData = [];
    const scPrice = 1529.47;
    const pmPrice = 1058.82;
    const iprice = 3150.30;
    const labour_cost = 320;

    users.forEach(user => {
      if (user.billing) {
        user.billing.forEach(bill => {
          let billSubtotal = 0; 
          let totalLabourMargin = 0;

          bill.items.forEach(item => {
            const equipMargin = item.equip_margin ? item.equip_margin / 100 : 0;
            const totalEquipMargin = item.unit_cost / (1 - equipMargin);

            const labourMargin = item.labour_margin ? item.labour_margin / 100 : 0;
            const unitLabourMargin = (labour_cost * 0.3) / (1 - labourMargin);
            const totalLabourItemMargin = item.stock_qty * unitLabourMargin;

            totalLabourMargin += totalLabourItemMargin;

            const itemTotalPrice = item.stock_qty * totalEquipMargin;
            billSubtotal += itemTotalPrice;

            billingData.push({
              bill_title: bill.bill_title,
              ref_num: user.ref_num,
              customer_email: user.email,
              saleName: user.saleName,
              cell: user.cell,
              customer_email: user.customer_email,
              customer_name: user.customer_name,
              labour_margin: item.labour_margin,
              equip_margin: item.equip_margin,
              product_type: item.product_type,
              descriptions: item.descriptions,
              stock_code: item.stock_code,
              stock_qty: item.stock_qty,
              unit_cost: Number(item.unit_cost) || 0,
              total_price: itemTotalPrice,
              total_labour_margin: totalLabourItemMargin,
              total_equip_margin: totalEquipMargin,
            });
          });

          const itemSubtotal = billSubtotal + totalLabourMargin + scPrice + pmPrice + iprice;

          billingData.forEach(data => {
            if (data.bill_title === bill.bill_title) {
              data.total_labour_margin = totalLabourMargin;
              data.bill_subtotal = itemSubtotal;
            }
          });
        });
      }
    });

    const salesPersonName = billingData.length > 0 ? billingData[0].saleName : '';
    const salesPersonCell = billingData.length > 0 ? billingData[0].cell : '';
    const customerEmail = billingData.length > 0 ? billingData[0].customer_email : '';

    res.render('printAllBilling', { billingData, salesPersonName, salesPersonCell, customerEmail });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.get('/printItem/:userId/:billingIndex/:itemIndex', async (req, res) => {
  try {
    const { userId, billingIndex, itemIndex } = req.params;

    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (billingIndex >= user.billing.length) {
      return res.status(404).send('Billing index out of range');
    }

    const billingEntry = user.billing[billingIndex];

    if (itemIndex >= billingEntry.items.length) {
      return res.status(404).send('Item index out of range');
    }

    const item = billingEntry.items[itemIndex];
    
    const scPrice = 1529.47;
    const pmPrice = 1058.82;
    const iprice = 3150.30;
    const labour_cost = 320;

    const equipMargin = item.equip_margin ? item.equip_margin / 100 : 0;
    const total_equip_margin = item.unit_cost / (1 - equipMargin);
    
    const labourMargin = item.labour_margin ? item.labour_margin / 100 : 0;
    const unit_labour_margin = (labour_cost * 0.3) / (1 - labourMargin);
    const total_labour_margin = item.stock_qty * unit_labour_margin;
    
    const total_price = item.stock_qty * total_equip_margin;
    const sub_total = total_price + total_labour_margin + scPrice + pmPrice + iprice;

    res.render('printItem', {
      user,
      billingEntry,
      item,
      billTitle: billingEntry.bill_title,
      equipMargin,
      labourMargin,
      unit_labour_margin,
      total_equip_margin,
      total_labour_margin,
      total_price,
      sub_total,
      scPrice,
      pmPrice,
      iprice,
      labour_cost,
    });
  } catch (error) {
    console.error('Error printing item:', error);
    res.status(500).send('Error printing item');
  }
});

app.get('/overview', async (req, res) => {
  try {
    const users = await User.find();
    const totalLabourHrs = users.reduce((total, user) => {
      return total + (user.labour_hrs || 0); 
    }, 0);
    
    const totalPrices = [];
    const unitCosts = [];

    users.forEach(user => {
      if (user.billing) {
        user.billing.forEach(bill => {
          bill.items.forEach(item => {
            totalPrices.push(item.total_price); 
            unitCosts.push(item.unit_cost); 
          });
        });
      }
    });

    const grandTotalPrice = totalPrices.reduce((sum, price) => sum + price, 0);
    const averageUnitCost = unitCosts.length > 0 ? (unitCosts.reduce((sum, cost) => sum + cost, 0) / unitCosts.length) : 0;

    res.render('overview', { users, totalLabourHrs, grandTotalPrice, averageUnitCost });
  } catch (error) {
    console.error('Error fetching data for overview:', error);
    res.status(500).send('Error fetching data for overview');
  }
});


// Start server
const port = 1520;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
