import "@babel/polyfill";
import axios from "axios";
require("../scss/main.scss");
const fx = require("money");

window.onload = function() {
  let list;
  let currSym = "$";
  let currTarget = "USD";

  //money.js config
  fx.base = "USD";
  fx.rates = {
    EUR: 0.886,
    GBP: 0.756,
    USD: 1
  };

  //parse url function
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
  // give parameter a var name
  let dynamicContent = getParameterByName("dc");

  if (dynamicContent == "USD") {
    currSym = "$";
    currTarget = "USD";
  } else if (dynamicContent == "EUR") {
    currSym = "€";
    currTarget = "EUR";
  } else if (dynamicContent == "GBP") {
    currSym = "£";
    currTarget = "GBP";
  } else {
    currSym = "$";
    currTarget = "USD";
  }

  //gets list on page load
  (function getList() {
    axios
      .get("http://private-32dcc-products72.apiary-mock.com/product")
      .then(res => {
        list = res.data;

        list.forEach(el => {
          //create product rows and sort them by price
          createProductRows(el.name, el.price, el.id);
        });
      })
      .catch(error => console.log(error));

    document.onclick = toggleHide;
  })();

  //toggle currency menu and sets currency handler
  function toggleHide(e) {
    e.preventDefault();
    if (!e.target.classList.contains("menu")) {
      document.querySelector(".curr-wrapper").classList.add("hide");
    } else {
      let parent = e.target.parentNode;
      let dropMenu = parent.querySelector(".curr-wrapper");
      if (dropMenu && dropMenu.classList.contains("hide")) {
        dropMenu.classList.remove("hide");
        dropMenu.onclick = handleCurr;
      } else if (dropMenu && !dropMenu.classList.contains("hide")) {
        dropMenu.classList.add("hide");
      }
    }
  }

  //updates currency for values
  function handleCurr(e) {
    e.preventDefault();
    let currName = e.target.getAttribute("data-curr-name");
    let currSymbol = e.target.getAttribute("data-template");
    let values = document.querySelectorAll(".value");
    currTarget = currName;

    values.forEach(el => {
      let parent = el.parentNode.parentNode;
      let [productItem] = list.filter(
        el => el.id == parent.id || el.id == parent.parentNode.id
      );

      if (productItem) {
        el.textContent = fx(productItem.price)
          .from(fx.base)
          .to(currName)
          .toFixed(2);
        updatePriceOnFx(el);
      }
    });

    let currs = document.querySelectorAll("[data-curr]");
    currs.forEach(el => {
      el.setAttribute("data-curr", currSymbol);
      el.textContent = currSymbol;
    });
    currSym = currSymbol;
  }

  //update price subtotal, for each cart item when currency is changed
  function updatePriceOnFx(el) {
    let parent = el.parentNode.parentNode;
    let [productItem] = list.filter(elem => elem.id == parent.id);
    let qty = parent.querySelector(".quantity-detail");

    if (qty) {
      el.textContent = (
        qty.value *
        fx(productItem.price)
          .from(fx.base)
          .to(currTarget)
      ).toFixed(2);
      calculateTotal();
    }
  }

  //creates product rows when list first retrieved and for items removed from cart
  function createProductRows(name, price, id) {
    let productWrapper = document.getElementById("prod-wrapper");
    let productDiv;
    if ([...productWrapper.children].length < 1) {
      // console.log("first product line return, is always on top");
      productDiv = createProduct("div", productWrapper, "product", null);
      productDiv.id = id;
    } else {
      let productRows = Array.from(productWrapper.querySelectorAll(".product"));
      let index = findPlaceToAppend(productRows, price);

      productDiv = document.createElement("div");
      productDiv.classList.add("product");
      productDiv.id = id;
      productWrapper.insertBefore(productDiv, productRows[index]);
    }

    //product name,price span,curr and value
    createProduct("span", productDiv, "prod-name", name);
    let prodPrice = createProduct("span", productDiv, "prod-price", "Price: ");
    let prodCurrency = createProduct(
      "span",
      prodPrice,
      "prod-currency",
      currSym
    );
    prodCurrency.setAttribute("data-curr", currSym);
    let prodValue = createProduct(
      "span",
      prodPrice,
      "prod-value",
      fx(price)
        .from(fx.base)
        .to(currTarget)
        .toFixed(2)
    );
    prodValue.classList.add("value");

    //product button
    let addCart = createProduct(
      "button",
      productDiv,
      "add-cart",
      "Add to cart"
    );
    addCart.onclick = addToCart;

    let cartIcon = document.createElement("i");
    cartIcon.classList.add("fas", "fa-shopping-cart", "icon-flipped");
    addCart.insertBefore(cartIcon, addCart.childNodes[0]);
  }

  //sorts the given list, and compares given price with prices from list, to find where to append
  function findPlaceToAppend(productRows, price) {
    productRows.sort((a, b) => {
      return (
        parseFloat(a.querySelector(".prod-value").textContent) -
        parseFloat(b.querySelector(".prod-value").textContent)
      );
    });

    for (let i = 0; i < productRows.length; i++) {
      if (
        parseFloat(productRows[i].querySelector(".prod-value").textContent) >=
        parseFloat(price)
      )
        return i;
    }

    return productRows.length;
  }

  //remove product row whene button was clicked and create item in cart+add listeners
  function addToCart(e) {
    e.preventDefault();
    let parent = e.currentTarget.parentNode.parentNode;
    let productEl = e.currentTarget.parentNode;
    let itemId = productEl.id;
    parent.removeChild(productEl);

    //attr object for the many attributes of qty input field
    let attr = {
      type: "number",
      value: "1",
      min: "1",
      max: "20"
    };

    //change text in cart when items added
    let prodCartText = document.querySelector(".prod-cart-text");
    if (prodCartText.textContent !== "Products in your shopping cart") {
      prodCartText.textContent = "Products in your shopping cart";
      unhide(".cart-details", ".total", ".continue");
    }

    //get matching id details from list, for the item being added
    let [productItem] = list.filter(el => el.id == itemId);

    //create elements to be added in cart
    let cartDetails = document.querySelector(".cart-details");
    let itemDetails = createProduct("div", cartDetails, "item-details", null);
    itemDetails.id = itemId;
    let prodName = createProduct(
      "div",
      itemDetails,
      "prod-detail",
      productItem.name
    );
    let description = document.createElement("i");
    description.classList.add("fas", "fa-info-circle");
    prodName.appendChild(description);
    prodName.setAttribute(
      "title",
      productItem.description || "no description available"
    );

    let qty = createProduct("input", itemDetails, "quantity-detail", null);
    setInputAttributes(attr, qty);
    qty.oninput = updatePrice;

    let prodPrice = createProduct("div", itemDetails, "price-div", null);
    let prodVal = createProduct(
      "span",
      prodPrice,
      "value-detail",
      fx(productItem.price)
        .from(fx.base)
        .to(currTarget)
        .toFixed(2)
    );

    let prodCurrency = document.createElement("span");
    prodCurrency.setAttribute("data-curr", currSym);
    prodCurrency.textContent = prodCurrency.getAttribute("data-curr");
    prodVal.classList.add("value");
    prodPrice.insertBefore(prodCurrency, prodVal);

    //if qty field was created, start calculating total
    if (qty) {
      calculateTotal();
    }

    //delete button
    let deleteIcon = createProduct("i", itemDetails, "delete-icon", null);
    deleteIcon.classList.add("far", "fa-trash-alt");
    deleteIcon.onclick = removeCartItem;
  }

  //update price on each cart row when qty input value changes
  function updatePrice(e) {
    let parent = e.target.parentNode;
    let [productItem] = list.filter(el => el.id == parent.id);
    let currValue = parent.querySelector(".value-detail");

    //condition for negative typed input
    if (e.target.value <= 0 || isNaN(e.target.value)) {
      e.target.value = 1;
    }
    currValue.textContent = (
      e.target.value *
      fx(productItem.price)
        .from(fx.base)
        .to(currTarget)
    ).toFixed(2);
    //update total when qty changes
    calculateTotal();
  }

  //update total
  function calculateTotal() {
    let values = Array.from(document.querySelectorAll(".value-detail"));

    let total = 0;
    for (let i = 0; i < values.length; i++) {
      total += Number(values[i].textContent);
    }
    let totalEl = document.querySelector(".total-val");
    totalEl.textContent = total.toFixed(2);
    let curr = totalEl.parentNode.querySelector("[data-curr]");
    curr.setAttribute("data-curr", currSym);
    curr.textContent = currSym;

    if (!values.length) {
      let prodCartText = document.querySelector(".prod-cart-text");
      hide(".cart-details", ".total", ".continue");
      prodCartText.textContent = "No products in your shopping cart";
    }
  }

  //remove items from cart
  function removeCartItem(e) {
    e.preventDefault();
    let parent = e.target.parentNode;
    let prodName = parent.querySelector(".prod-detail").textContent;
    let id = parent.id;
    e.target.parentNode.remove();
    calculateTotal();
    let [productItem] = list.filter(el => el.id == id);
    createProductRows(prodName, productItem.price, id);
  }

  //helper function for element creation
  function createProduct(elem, parent, className, textCont) {
    let newEl = document.createElement(elem);
    newEl.textContent = textCont || "";
    newEl.classList.add(className);
    parent.appendChild(newEl);
    return newEl;
  }

  //helper function for input attributes
  function setInputAttributes(attr, qty) {
    for (let key in attr) {
      qty.setAttribute(key, attr[key]);
    }
  }

  //helper unhide function
  function unhide(...args) {
    for (let arg of args) {
      document.querySelector(arg).classList.remove("hide");
    }
  }
  //helper unhide function
  function hide(...args) {
    for (let arg of args) {
      document.querySelector(arg).classList.add("hide");
    }
  }
};
