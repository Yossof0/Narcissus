### Add

- Phone Number Requirement for creating a new account
- Login could be done with email/username/phone-number + password
- Reset Password could be done with email/phone-number
- phone number should be verified via SMS
- instead of 2 tabs in login page (Login/Create Account), Set the default to Login, and add "No Account?, Sign UP!"
- Sign up is made of 4 steps each step is done individually,
- in the product add to cart page, for admins and above, there is a reset rating button
- Make an Owner Panel, like the admin panel but instead of products and orders, DashBoard and terminal, the terminal should be something like a website CLI, with green foreground, black background
- in dashboard, list all the accounts, you can add an account to admin, remove him from admin, see all of his info but password, see his order history, change his order status
- in the admin panel in the orders tab, display the customer's address under his email
- in dashboard, you can sort all the accounts by privileges
- Term "Product Identifier": an id that is only visible to owner when he checks out a product either from store, or from the products tab in admin panel
- Term "Identifier": An element that identifies the user, (phone-number/username/email)
- in terminal, add these commands
  - create-account "identifier" "password"
  - remove-account "identifier"
  - reset-rating "product-identifier"
  - order-history "identifier"
- Commands should apply instantly to all instances
- #### Step 1: Account Info
  - Ask For Username, Full Name , email, password, confirm password

- #### Step 2:
  - Confirm Email

- #### Step 3: Important User Info
  - Ask for Address, Birthday, phone number

- #### Step 4:
  - Confirm Phone Number via SMS

- #### Profile Section:

  - Add a way to change email and phone number, and username
  - When changing password, just make it a section with title Request a password change, then a button called request, when you click it, it should show a popup, to select either phone number/email to confirm do not ask for any password input, since when he clicks on the confirm link in the email/sms, it will tell him to fill it again, so just tell him one time after you click the confirmation link

    
- When Trying to delete a product, it shows a legacy confirm, we don't want that!! so display a nice popup that asks if he wants to delete the product, with a checkbox of Don't ask me again, should be off by default, but if he checks at and clicks Delete, it shouldn't ask him again

- Owner and admins should be next to each other, create a var, and an array to reuse them across all files
- Admin = "abdelwahedrowan@gmail.com", Owner = "yossef2989@gmail.com", and tell me where to modify them whenever i want

### Privileges:

- #### Guest:

    - Can Browse Through products
    - Make orders
    - Can Favorite Products

- #### User:

    - Has all guest access
    - Can Sign out
    - Has access to profile section
    - Has access to order history
    - Can Rate Products

- #### Admin:

    - Has all user access.
    - Can Access Admin Panel (product management/order panel)
    - Can reset rating
    - Can be multiple admins, .i.e array ["abdelwahedrowan@gmail.com", "others@example.com", "identifier"]

- #### Owner:

  - Has all admin access.
  - The Order Confirmation email is sent to him,
  - Can only be one, .i.e variable ("yossef2989@gmail.com")
  - Has access to terminal
  - Has access to dashboard