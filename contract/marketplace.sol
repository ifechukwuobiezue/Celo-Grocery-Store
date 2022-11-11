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

    uint internal productsLength;
    uint internal soldUnits;
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
        uint sold;
    }

    struct Order{
        address initiator;
        string location;
        uint timestamp;
        bool fufilled;
    }

    //Working with multiple Products
    mapping (uint => Product) internal products;
    mapping (address => Order) internal orders;
    
    address admin;

    //All Events triggered when specific functions are called
    event AddedProduct(address indexed owner, uint256 product_quantity, uint256 product_index);
    event BoughtProduct(address indexed buyer, uint256 product_quantity, uint256 product_index);
    event RestockedProducts(address indexed owner, uint product_quantity_added, uint256 product_index);
    event ProductOutOfStock(address indexed owner, uint256 product_index);

    constructor(){
        admin = msg.sender;
    }

    modifier onlyOwner(uint index){
        require(msg.sender == products[index].owner, "Only Owner");
        _;
    }

    //funtion to Add Product
    function writeProduct(
        string calldata _name,
        string calldata _image,
        string calldata _description, 
        string calldata _location,
        uint _quantity,
        uint _price
    ) public 
    {
        require(_price > 0 && _quantity > 0, "invalid input");
         require(bytes(_name).length > 0, "Empty name");
        require(bytes(_image).length > 0, "Empty image");
        require(bytes(_description).length > 0, "Empty description");
        require(bytes(_location).length > 0, "Empty location");

        products[productsLength] = Product(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _quantity,
            _price,
            0
            
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
        ) 
    {
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

    function getOrder(address _address) public view returns(
        address,
        string memory,
        uint,
        bool
    ){
        return(
            orders[_address].initiator,
            orders[_address].location,
            orders[_address].timestamp,
            orders[_address].fufilled
        );
    }


//function to buy Product
    function buyProduct(uint _index, uint256 quantity) public payable  {
        require (quantity <= products[_index].quantity, "You cannot buy more than the stock!");
        require(msg.sender != products[_index].owner, "Owner cannot buy");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            products[_index].owner,
            products[_index].price * quantity
          ),
          "Purchase failed!"
        );
        products[_index].quantity -= quantity;
        products[_index].sold  +=  quantity;
        soldUnits += quantity;
        //Add product to orders
        orders[msg.sender] = Order(
            msg.sender,
            products[_index].location,
            block.timestamp,
            false
        );
        emit BoughtProduct(msg.sender, quantity, _index); // emiting the BoughtProduct event
        if (products[_index].quantity == 0) {
            emit ProductOutOfStock(products[_index].owner, _index); // emiting the ProductOutOfStock event if quantity is 0
        }
    }

    function fufillOrder(address _address) public {
        require (msg.sender == admin, "Cannot fufill order");
        orders[_address].fufilled = true;
    }

    function deleteProduct(uint _index) public onlyOwner(_index) {
        delete products[_index];
    }
    
    //Restock function to add more grocerys when finished
    function restock(uint _index,uint _quantity) public onlyOwner(_index){
        products[_index].quantity += _quantity;
        emit RestockedProducts(msg.sender, _quantity, _index);
    }

    //function to know how many grocerys displayed
    function getProductsLength() public view returns (uint) {
        return (productsLength);
    }

    //function to know how many grocerys sold
    function getUnitsSold() public view returns(uint){
        return (soldUnits);
    }

}
