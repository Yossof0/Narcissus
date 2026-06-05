### Fix:

- [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
  TypeError: fetch failed
  at node:internal/deps/undici/undici:15845:13
  at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
  at async _handleRequest (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\lib\fetch.ts:221:14)
  at async _request (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\lib\fetch.ts:194:16)
  at async SupabaseAuthClient._getUser (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\GoTrueClient.ts:2993:16)
  at async SupabaseAuthClient.getUser (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\GoTrueClient.ts:2974:14)
  at async Object.createContext (C:\Users\DELL\Projects\Websites\Narcissus App\server\_core\context.ts:27:31)
  at async Object.createContext (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\adapters\node-http\nodeHTTPRequestHandler.ts:94:18)
  at async Object.create (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\unstable-core-do-not-import\http\resolveResponse.ts:272:23)
  at async resolveResponse (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\unstable-core-do-not-import\http\resolveResponse.ts:311:5)
  at async <anonymous> (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\adapters\node-http\nodeHTTPRequestHandler.ts:100:26) {
  [cause]: ConnectTimeoutError: Connect Timeout Error (attempted addresses: 104.18.38.10:443, timeout: 10000ms)
  at onConnectTimeout (node:internal/deps/undici/undici:1690:23)
  at Immediate._onImmediate (node:internal/deps/undici/undici:1656:35)
  at process.processImmediate (node:internal/timers:504:21) {
  code: 'UND_ERR_CONNECT_TIMEOUT'
  }
  }
  TypeError: fetch failed
  at node:internal/deps/undici/undici:15845:13
  at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
  at async _handleRequest (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\lib\fetch.ts:221:14)
  at async _request (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\lib\fetch.ts:194:16)
  at async SupabaseAuthClient._getUser (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\GoTrueClient.ts:2993:16)
  at async SupabaseAuthClient.getUser (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@supabase+auth-js@2.105.4\node_modules\@supabase\auth-js\src\GoTrueClient.ts:2974:14)
  at async Object.createContext (C:\Users\DELL\Projects\Websites\Narcissus App\server\_core\context.ts:27:31)
  at async Object.createContext (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\adapters\node-http\nodeHTTPRequestHandler.ts:94:18)
  at async Object.create (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\unstable-core-do-not-import\http\resolveResponse.ts:272:23)
  at async resolveResponse (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\unstable-core-do-not-import\http\resolveResponse.ts:311:5)
  at async <anonymous> (C:\Users\DELL\Projects\Websites\Narcissus App\node_modules\.pnpm\@trpc+server@11.6.0_typescript@5.9.3\node_modules\@trpc\server\src\adapters\node-http\nodeHTTPRequestHandler.ts:100:26) {
  [cause]: ConnectTimeoutError: Connect Timeout Error (attempted addresses: 104.18.38.10:443, timeout: 10000ms)
  at onConnectTimeout (node:internal/deps/undici/undici:1690:23)
  at Immediate._onImmediate (node:internal/deps/undici/undici:1656:35)
  at process.processImmediate (node:internal/timers:504:21) {
  code: 'UND_ERR_CONNECT_TIMEOUT'
  }
  }
- When trying to edit an already existing product as admin, it sometimes tell me you are unauthorized or it says admin only, even tho i am admin
- When you finish checkout, it should send me an email: yossef2989@gmail.com, which contains purchased items info, and his info, plus acc, info
- How do you track Order Status and update it to the user
- Each Element on the page should be translatable from ar to en including product details .I.E quantity selectors and product details, instead of typing new product details in each language, use a translation api, for static text .i.e "No products found", translate them yourself.
### Add

- The Ability to Favorite A Product, on the product display it should show in the top right corner of the image a love/heart icon and when you click it, it should fav the product, and when you look at recommended products, it should be related to your fav products
- The Ability to rate a product from 5 stars, and half rating should be supported I.E = 0.5,1.5,2.5...etc. You Have to be logged in to rate
- How it should work is that there is a rate button when you click it, it displays a popup With the stars and the rate method I told you, obv you can't click the button if you are not logged in, it should display next to that rate button, the avg rate, and the amount of rates, 
- Products should be sorted auto at first; Top Rated.
- Create Another button below the profile button, the sign-out button, should be Called Order History
- It shows you the history of your orders and your current order and the Order Status, you should be logged in to access that feature
- Update the (You don't need an account to shop. Browse & checkout as guest →) and include "Yet you still need an account to access Order History, Track Your Orders, and other Features"

### Questions

- How do I deploy this website
- Where do I export my images to import them into the website via URL, Since, I don't want to use direct import, As it would take up space?


### Add