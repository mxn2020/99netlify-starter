# Account System Manual Testing Guide

## Prerequisites
1. Start the development server: `npm run dev`
2. Start Netlify functions: `netlify dev` (in a separate terminal)
3. Open the application at `http://localhost:5173`

## Test Scenarios

### 1. User Registration and Personal Account Creation
**Expected Behavior**: New users automatically get a personal account

1. Navigate to Register page
2. Create a new user account
3. After successful registration:
   - Check that you're logged in
   - Look for an account selector in the navigation bar
   - Verify you have a personal account named after your user name

### 2. Account Selector Functionality
**Expected Behavior**: Users can view and switch between accounts

1. Click on the account selector in the navigation bar
2. Verify it shows your personal account
3. Check that it displays the account type (Personal)
4. Verify the correct icon (User icon for personal accounts)

### 3. Accounts Management Page
**Expected Behavior**: Users can manage accounts and members

1. Navigate to "Accounts" in the sidebar menu
2. Verify you can see your accounts listed
3. Click on your personal account to view details
4. Check that you have "owner" role on your personal account
5. Try creating a new account (e.g., Family or Team account)

### 4. Notes with Account Context
**Expected Behavior**: Notes are created and displayed with account context

1. Navigate to Notes page
2. Check that the account context is displayed at the top
3. Create a new note
4. Verify the note is associated with the current account
5. Switch accounts (if you have multiple) and verify note filtering

### 5. Blog Posts with Account Context
**Expected Behavior**: Blog posts show account context in admin areas

1. Navigate to Blog Admin page (if you have admin privileges)
2. Check that account context is displayed
3. Create a new blog post
4. Verify the post creation shows the current account
5. Check that the post is associated with your account

### 6. Account Switching (If Multiple Accounts)
**Expected Behavior**: Switching accounts updates content context

1. If you have multiple accounts, use the account selector to switch
2. Navigate to Notes page
3. Verify that the displayed account context updates
4. Check that content is filtered by the selected account
5. Try creating content in different accounts

### 7. Role-Based Permissions (Advanced)
**Expected Behavior**: Different roles have different permissions

1. Create a team/family account
2. Invite another user (if available for testing)
3. Assign different roles (viewer, editor, admin)
4. Test content creation/editing permissions for each role

## Visual Indicators to Look For

### Account Context Display
- **Account Selector**: Blue rounded box with account name and type
- **Personal Accounts**: User icon
- **Other Account Types**: Building icon
- **Account Type Label**: (personal), (family), (team), (enterprise)

### Page Headers
- **Notes Page**: Account context shown below page title
- **Blog Editor**: Account context in top-right corner
- **Blog Admin**: Account context below page title

### Account Management
- **Accounts Page**: List of accounts with role indicators
- **Member Management**: Role badges and invitation status
- **Permission Indicators**: Different UI elements based on your role

## Common Issues to Test

### Error Handling
1. Try creating content without selecting an account
2. Test with invalid permissions
3. Try accessing accounts you don't have access to

### Data Consistency
1. Create content in one account
2. Switch to another account
3. Verify content doesn't leak between accounts
4. Switch back and verify content is still there

### UI Responsiveness
1. Test account selector on different screen sizes
2. Verify account context displays properly on mobile
3. Check that account management works on different devices

## Success Criteria

✅ **Registration**: New users get personal accounts automatically  
✅ **Account Selection**: Users can see and switch between accounts  
✅ **Content Isolation**: Content is properly associated with accounts  
✅ **Role Permissions**: Different roles have appropriate access levels  
✅ **UI Consistency**: Account context is clearly shown throughout the app  
✅ **Error Handling**: Appropriate errors for invalid operations  

## Troubleshooting

### No Account Selector Visible
- Check that user is logged in
- Verify AccountProvider is wrapped around the app
- Check browser console for errors

### Content Not Filtered by Account
- Verify account ID is being passed in API requests
- Check that backend functions are using account context
- Look for account validation errors in backend logs

### Permission Errors
- Verify user role in current account
- Check that account membership is active
- Ensure account context is properly set

This manual testing approach ensures all key features of the account system are working correctly before production deployment.
