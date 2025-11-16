/**
 * 🔒 SECURE ADMIN CREATION SCRIPT
 * 
 * This script creates an admin account securely through CLI
 * Usage: node scripts/createAdmin.js
 * 
 * SECURITY: This replaces the public admin creation endpoint
 */

const bcrypt = require('bcrypt');
const readline = require('readline');
const { User, sequelize } = require('../src/utils/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    console.log('\n🔐 SECURE ADMIN ACCOUNT CREATION\n');
    console.log('=' .repeat(50));

    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}\n`);
      
      const overwrite = await question('Do you want to create another admin? (yes/no): ');
      if (overwrite.toLowerCase() !== 'yes') {
        console.log('\n❌ Operation cancelled');
        process.exit(0);
      }
    }

    // Get admin details
    const name = await question('\n👤 Admin Name: ');
    const email = await question('📧 Admin Email: ');
    
    // Password with confirmation
    let password, confirmPassword;
    do {
      password = await question('🔑 Password (min 8 chars, 1 upper, 1 lower, 1 number, 1 special): ');
      confirmPassword = await question('🔑 Confirm Password: ');
      
      if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match! Try again.\n');
      }
    } while (password !== confirmPassword);

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('\n❌ Password does not meet requirements!');
      console.log('   Requirements:');
      console.log('   - At least 8 characters');
      console.log('   - One uppercase letter');
      console.log('   - One lowercase letter');
      console.log('   - One number');
      console.log('   - One special character (@$!%*?&)');
      process.exit(1);
    }

    // Validate inputs
    if (!name || !email || !password) {
      console.log('\n❌ All fields are required!');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('\n❌ Invalid email format!');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('\n❌ Email already exists!');
      process.exit(1);
    }

    console.log('\n⏳ Creating admin account...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Use 12 rounds for extra security

    // Create admin
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      department: 'Administration',
      isActive: true
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('=' .repeat(50));
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🆔 ID: ${admin.id}`);
    console.log(`🔒 Role: ${admin.role}`);
    console.log('=' .repeat(50));
    console.log('\n🎉 You can now login with these credentials!\n');

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
createAdmin();
