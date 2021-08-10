/*globals paypal*/
import React, { useEffect } from "react";

export default () => {
  useEffect(() => {
    var itemOptions = document.querySelector(
      "#smart-button-container #item-options"
    );
    var quantity = 1;
    var orderDescription = "Rocky Gorge Fall Dues";
    if (orderDescription === "") {
      orderDescription = "Item";
    }

    paypal
      .Buttons({
        style: {
          shape: "pill",
          color: "blue",
          layout: "vertical",
          label: "buynow"
        },
        createOrder: function (data, actions) {
          var selectedItemDescription =
            itemOptions.options[itemOptions.selectedIndex].value;
          var selectedItemPrice = parseFloat(
            itemOptions.options[itemOptions.selectedIndex].getAttribute("price")
          );
          var priceTotal = quantity * selectedItemPrice;
          priceTotal = Math.round(priceTotal * 100) / 100;
          var itemTotalValue =
            Math.round(selectedItemPrice * quantity * 100) / 100;

          return actions.order.create({
            purchase_units: [
              {
                description: orderDescription,
                amount: {
                  currency_code: "USD",
                  value: priceTotal,
                  breakdown: {
                    item_total: {
                      currency_code: "USD",
                      value: itemTotalValue
                    },
                    shipping: {
                      currency_code: "USD",
                      value: 0
                    },
                    tax_total: {
                      currency_code: "USD",
                      value: 0
                    }
                  }
                },
                items: [
                  {
                    name: selectedItemDescription,
                    unit_amount: {
                      currency_code: "USD",
                      value: selectedItemPrice
                    },
                    quantity: quantity
                  }
                ]
              }
            ]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (orderData) {
            // Full available details
            console.log(
              "Capture result",
              orderData,
              JSON.stringify(orderData, null, 2)
            );

            // Show a success message within this page, e.g.
            const element = document.getElementById("paypal-button-container");
            element.innerHTML = "";
            element.innerHTML = "<h3>Thank you for your payment!</h3>";

            // Or go to another URL:  actions.redirect('thank_you.html');
          });
        },
        onError: function (err) {
          console.log(err);
        }
      })
      .render("#paypal-button-container");
  }, []);

  return (
    <div id="smart-button-container">
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <p>Rocky Gorge Fall Dues</p>
          <select id="item-options">
            <option value="Player Dues" price="175">
              Player Dues - 175 USD
            </option>
            <option value="New Player Dues" price="150">
              New Player Dues - 150 USD
            </option>
          </select>
          <select style={{ visibility: "hidden" }} id="quantitySelect"></select>
        </div>
        <div id="paypal-button-container"></div>
      </div>
    </div>
  );
};
