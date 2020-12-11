Open new terminal

```
cp .env.example .env
npm install
node lib browser:start
```

Open new terminal again

```
node lib credential:add --username "yourusername@gmail.com"
node lib login:shopee
```

Now, you can buy things by using following command

```
node lib buy:shopee --url "https://shopee.co.id/product-to-buy.60755826.3207661975"
```