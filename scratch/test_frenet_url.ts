
import fetch from 'node-fetch';

const url = "https://whitelabel.frenet.com.br/v1/shipments";
const token = "AB341B5DR56D1R438AR905ER61598F036D68";

const payload = {
  "shipping_service_code": "03220",
  "order_number": "E0YznHQaGz6hpVCtbcPF",
  "value": 1.0,
  "recipient": {
    "zip_code": "04210040",
    "address": "Rua Palmares",
    "number": "121",
    "complement": "apto 1006",
    "neighborhood": "Ipiranga",
    "city": "São Paulo",
    "state": "SP",
    "country": "BR",
    "email": "fabiozacari@gmail.com",
    "cell_phone": "11944344314",
    "document": "26258410871"
  },
  "seller": {
    "zip_code": "01001000"
  },
  "items": [
    {
      "quantity": 1,
      "sku": "eqlRw1ESolKPrVdnXikk",
      "description": "Perfume teste",
      "unit_value": 1.0,
      "weight": 0.5,
      "length": 10,
      "width": 10,
      "height": 15
    }
  ]
};

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': token, 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${data}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test();
