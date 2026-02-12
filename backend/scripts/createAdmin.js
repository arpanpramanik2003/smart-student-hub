/**
 * 🔒 SECURE ADMIN CREATION SCRIPT
 * 
 * This script creates an admin account securely through CLI
 * Usage: node scripts/createAdmin.js
 * 
 * SECURITY: This replaces the public admin creation endpoint
 */

const bcrypt = require('bcryptjs');
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
    const existingAdmins = await User.findAll({ where: { role: 'admin' } });
    
    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin account(s) already exist:\n');
      
      existingAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   ID: ${admin.id}\n`);
      });
      
      console.log('What would you like to do?');
      console.log('1. Reset password for an existing admin');
      console.log('2. Create another admin account');
      console.log('3. Cancel\n');
      
      const choice = await question('Enter your choice (1/2/3): ');
      
      if (choice === '1') {
        // Reset password for existing admin
        let selectedAdmin;
        
        if (existingAdmins.length === 1) {
          selectedAdmin = existingAdmins[0];
        } else {
          const adminChoice = await question(`\nSelect admin to reset (1-${existingAdmins.length}): `);
          const adminIndex = parseInt(adminChoice) - 1;
          
          if (adminIndex < 0 || adminIndex >= existingAdmins.length) {
            console.log('\n❌ Invalid selection!');
            process.exit(1);
          }
          
          selectedAdmin = existingAdmins[adminIndex];
        }
        
        console.log(`\n🔄 RESETTING PASSWORD FOR: ${selectedAdmin.email}\n`);
        
        let password, confirmPassword;
        do {
          password = await question('🔑 New Password (min 8 chars, 1 upper, 1 lower, 1 number, 1 special): ');
          confirmPassword = await question('🔑 Confirm New Password: ');
          
          if (password !== confirmPassword) {
            console.log('\n❌ Passwords do not match! Try again.\n');
          }
        } while (password !== confirmPassword);

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])[A-Za-z\d@$!%*?&._\-]{8,}$/;
        if (!passwordRegex.test(password)) {
          console.log('\n❌ Password does not meet requirements!');
          console.log('   Requirements:');
          console.log('   - At least 8 characters');
          console.log('   - One uppercase letter');
          console.log('   - One lowercase letter');
          console.log('   - One number');
          console.log('   - One special character (@$!%*?&._-)');
          process.exit(1);
        }

        console.log('\n⏳ Updating password...');

        // Set password directly - the User model's beforeUpdate hook will hash it
        selectedAdmin.password = password;
        await selectedAdmin.save();

        console.log('\n✅ Admin password updated successfully!');
        console.log('=' .repeat(50));
        console.log(`📧 Email: ${selectedAdmin.email}`);
        console.log(`👤 Name: ${selectedAdmin.name}`);
        console.log(`🆔 ID: ${selectedAdmin.id}`);
        console.log('=' .repeat(50));
        console.log('\n🎉 You can now login with the new password!\n');
        
        process.exit(0);
        
      } else if (choice === '2') {
        console.log('\n➕ Creating another admin account...\n');
        // Continue to create new admin (fall through)
      } else {
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])[A-Za-z\d@$!%*?&._\-]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('\n❌ Password does not meet requirements!');
      console.log('   Requirements:');
      console.log('   - At least 8 characters');
      console.log('   - One uppercase letter');
      console.log('   - One lowercase letter');
      console.log('   - One number');
      console.log('   - One special character (@$!%*?&._-)');
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

    // Create admin - the User model's beforeCreate hook will hash the password
    const admin = await User.create({
      name,
      email,
      password, // Pass plain password, model will hash it
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
