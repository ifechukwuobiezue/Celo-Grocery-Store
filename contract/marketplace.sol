// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;
//Transaction on ErC20token     
interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);
 
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

//define Contract
contract Marketplace {

    uint internal productsLength = 0;
    uint internal soldUnits=0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

//Variables saved with struct
    struct Product {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint quantity;
        uint price;
    }

//Working with multiple Products
    mapping (uint => Product) internal products;

    //All Events triggered when specific functions are called
    event AddedProduct(address indexed owner, uint256 product_quantity, uint256 product_index);
    event BoughtProduct(address indexed buyer, uint256 product_quantity, uint256 product_index);
    event RestockedProducts(address indexed owner, uint product_quantity_added, uint256 product_index);
    event ProductOutOfStock(address indexed owner, uint256 product_index);

//funtion to Add Product
    function writeProduct(
        string memory _name,
        string memory _image,
        string memory _description, 
        string memory _location,
        uint _quantity,
        uint _price
    ) public {
        products[productsLength] = Product(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _quantity,
            _price
            
        );
        emit AddedProduct(msg.sender, _quantity, productsLength);
        productsLength++;
    }
//Function for product display in other to read product
    function readProduct(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        string memory, 
        uint, 
        uint
    ) {
        return (
            products[_index].owner,
            products[_index].name, 
            products[_index].image, 
            products[_index].description, 
            products[_index].location, 
            products[_index].quantity,
            products[_index].price
        );
    }

//function to buy Product
    function buyProduct(uint _index, uint256 quantity) public payable  {
        require (quantity <= products[_index].quantity, "You cannot buy more than the stock!");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            products[_index].owner,
            products[_index].price * quantity
          ),
          "Purchase failed!"
        );
        products[_index].quantity = products[_index].quantity - quantity;
        soldUnits = soldUnits + quantity;
        emit BoughtProduct(msg.sender, quantity, _index); // emiting the BoughtProduct event
        if (products[_index].quantity == 0) {
            emit ProductOutOfStock(products[_index].owner, _index); // emiting the ProductOutOfStock event if quantity is 0
        }
    }
    
    //function to know how many grocerys displayed
    function getProductsLength() public view returns (uint) {
        return (productsLength);
    }

    //function to know how many grocerys sold
    function getUnitsSold() public view returns(uint){
        return (soldUnits);
    }

    //Restock function to add more grocerys when finished
    function restock(uint _index,uint _quantity) public {
        require (msg.sender == products[_index].owner, "Only the owner can restock");
        products[_index].quantity= products[_index].quantity+ _quantity;
        emit RestockedProducts(msg.sender, _quantity, _index);
    }
}
