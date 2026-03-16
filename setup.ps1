Remove-Item -Recurse -Force posts*.config.js, tailwind.config.js -ErrorAction SilentlyContinue
npx -y create-vite@latest temp-app --template react
Move-Item -Path .\temp-app\* -Destination .\ -Force
Remove-Item -Recurse -Force .\temp-app
npm install
npm install -D tailwindcss@3.4.17 postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react gsap chart.js react-chartjs-2 jspdf jspdf-autotable xlsx
