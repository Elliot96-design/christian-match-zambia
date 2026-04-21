# Christian Match Zambia — TODO

## Database Schema
- [x] Extend users table with profile fields (age, gender, location, church, bio, photoUrl, photoKey, isBanned)
- [x] Create chatUnlocks table (userId, targetUserId, paymentStatus, amount, provider, createdAt)
- [x] Create messages table (roomId, senderId, content, createdAt)
- [x] Run db:push to apply migrations

## Authentication & Profile Setup
- [x] Sign-up / login via Manus OAuth (email or phone)
- [x] Profile setup wizard (name, age, gender, location, church, bio)
- [x] Profile picture upload (single photo, stored in S3)
- [x] Edit profile page

## Browse / Matching
- [x] Browse page with user cards (photo, name, age, church)
- [x] Filter by gender and location
- [x] Latest order listing
- [x] Pagination (load more)

## Payment-Gated Chat
- [x] Locked chat button with label "Unlock chat to start conversation"
- [x] Payment modal (MTN / Airtel placeholder + mock)
- [x] Mock payment flow (simulate success)
- [x] Server-side unlock: store chatUnlock record in DB
- [x] Server-side enforcement: only allow chat if payment_status = true for user pair

## Real-Time Chat
- [x] Chat room page (roomId = sorted pair of userIds)
- [x] Send and receive messages (polling every 3s)
- [x] Message list with timestamps
- [x] Input box with send button

## Admin Panel
- [x] Admin-only route guard
- [x] View all users table
- [x] Ban / unban user action
- [x] View all payments table

## UI / UX
- [x] Global theme: white background, soft blue accents, large buttons
- [x] Mobile-first responsive layout
- [x] Bottom navigation bar for mobile
- [x] Loading skeletons for cards
- [x] Optimized image display (lazy loading, object-fit cover)
- [x] No heavy animations

## Security
- [x] Server-side chat access check (payment_status enforcement in tRPC)
- [x] Banned users cannot browse
- [x] Admin role enforcement on admin procedures

## Testing
- [x] Vitest: chat unlock procedure tests
- [x] Vitest: payment procedure tests
- [x] Vitest: admin ban procedure tests

## Logo & Navigation Updates
- [x] Upload and set new Christian Match Zambia logo image
- [x] Add logo to Home/Landing page header
- [x] Add logo to ProfileSetup page header
- [x] Add back button to ProfileView page
- [x] Add back button to ChatRoom page
- [x] Add sign-out button to Browse page header
- [x] Add sign-out button to EditProfile page header
- [x] Add back + sign-out to AdminPanel header
- [x] Create shared AppHeader component with logo, optional back, optional sign-out
