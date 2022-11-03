//Import all files and dependencies
import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import marketplaceAbi from "../contract/marketplace.abi.json";
import erc20Abi from "../contract/erc20.abi.json";
//Transaction on Erc20 and CeloUsd
const ERC20_DECIMALS = 18;
const MPContractAddress = "0xC7a457A94833F22dd3f7a8B9455b5CEDCBBFe300";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

//Declaration of variables
let kit;
let contract;
let products = [];

//selecting All DOM elements
const newProductBtn = document.querySelector("#newProductBtn");
let marketplace = document.querySelector("#marketplace");
const cUsdBalanceElement = document.querySelector("#balance");
const alertElement = document.querySelector(".alert");
const lenthCounter = document.querySelector("#listcount");
const soldCounter = document.querySelector("#soldcount");

//Connect Wallet
const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

//Approve Buy
async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

//Get Wallet Balance
const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  cUsdBalanceElement.textContent = cUSDBalance;
};

//Render Previously Added Products
const getProducts = async function () {
  const _productsLength = await contract.methods.getProductsLength().call();
  const _products = [];
  for (let i = 0; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readProduct(i).call();
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        quantity: p[5],
        price: new BigNumber(p[6]),
      });
    });
    _products.push(_product);
  }
  products = await Promise.all(_products);
  renderProducts();
};

//Display Products
function renderProducts() {
  marketplace.innerHTML = "";
  products.forEach((_product) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = productTemplate(_product);
    marketplace.appendChild(newDiv);
  });
}

//Create Product Template
function productTemplate(_product) {
  return `
      <div class="card shadow p-3 mb-5 bg-white rounded">
        <img class="card-img-top" src="${_product.image}" alt="...">
        <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
          ${_product.quantity} Remaining
        </div>
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
          <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
          <p class="card-text mb-4" style="min-height: 82px">
            ${_product.description}             
          </p>
          <p class="card-text mt-4">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${_product.location}</span>
          </p>
          <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-success buyBtn fs-6 p-3" data-bs-toggle="modal" data-bs-target="#quantity-modal" id=${
              _product.index
            }>
              ${_product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
            </a>
          </div>
          <br/>
          <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-success restockBtn fs-6 p-3" data-bs-toggle="modal" data-bs-target="#restock-modal" id=${
              _product.index
            } >Restock</a>
          </div>
          <div class="d-grid gap-2 mt-4">
            <b class="text-secondary">Last sale: ${
              Math.floor(Math.random() * 10) + 1
            }cUsd</b>
          </div>
        </div>
      </div>
      `;
}

//Insert Identicon
function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
            <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
              <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
                  target="_blank">
                  <img src="${icon}" width="48" alt="${_address}">
              </a>
            </div>
            `;
}

//Turn on Notification
function notification(_text) {
  alertElement.style.display = "block";
  document.querySelector("#notification").textContent = _text;
  setTimeout(notificationOff, 7000);
}

//Turn off Notification
function notificationOff() {
  alertElement.style.display = "none";
}

//Initailization funtion
window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getProducts();
  await getCounter();
  notificationOff();
});

//Add New Product
newProductBtn.addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newProductName").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("newProductDescription").value,
    document.getElementById("newLocation").value,
    document.getElementById("newProductQuantity").value,
    new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString(),
  ];

  notification(`⌛ Adding "${params[0]}"...`);
  try {
    const result = await contract.methods
      .writeProduct(...params)
      .send({ from: kit.defaultAccount });
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
  notification(`🎉 You successfully added "${params[0]}".`);
  await getCounter();
  getProducts();
});

//Buy function
marketplace.addEventListener("click", async (e) => {
  let buyQuantity;
  let inputEL = document.getElementById("buyquantity");

  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id;
    document
      .getElementById("buyquantitysubmit")
      .addEventListener("click", async (e) => {
        e.preventDefault();
        buyQuantity = inputEL.value;
        if (products[index].quantity !== "0") {
          notification("⌛ Waiting for payment approval...");
          let netPrice = products[index].price * buyQuantity;
          try {
            await approve(netPrice.toString());
          } catch (error) {
            notification(`⚠️ ${error}.`);
          }
          notification(`⌛ Awaiting payment for "${products[index].name}"...`);
          try {
            const result = await contract.methods
              .buyProduct(index, buyQuantity)
              .send({ from: kit.defaultAccount });
            notification(
              `🎉 You successfully bought "${products[index].name}".`
            );
            getProducts();
            getBalance();
            await getCounter();
          } catch (error) {
            notification(`⚠️ ${error}.`);
          }
        } else {
          notification(
            `⚠️ Product is currently out of stock, please try again later`
          );
        }
        //Reload page after product has been bought
        location.reload();
      });
  }
});

//Restock function
marketplace.addEventListener("click", async (e) => {
  let newQuantity;
  let inputEl = document.getElementById("restockfield");

  if (e.target.className.includes("restockBtn")) {
    const index = e.target.id;
    document
      .querySelector("#restockbtnsubmit")
      .addEventListener("click", async (e) => {
        newQuantity = inputEl.value;
        if (newQuantity !== "")
          try {
            await contract.methods
              .restock(index, newQuantity)
              .send({ from: kit.defaultAccount });
            notification(
              `🎉 You have successfully restocked "${products[index].name}".`
            );
            getProducts();
          } catch (error) {
            notification(`⚠️ ${error}.`);
          }
      });
  }
});

//Get and Set Counter
async function getCounter() {
  //calling contract methods
  let productLength = await contract.methods.getProductsLength().call();
  let soldProducts = await contract.methods.getUnitsSold().call();
  //setting textcontent
  lenthCounter.textContent = productLength;
  soldCounter.textContent = soldProducts;
}
