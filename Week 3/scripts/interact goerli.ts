const hre = require("hardhat");
const Library = require('../artifacts/contracts/Library.sol/Library.json');
import { Library } from "../typechain-types";

const run = async function() {
    const provider = new hre.ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
    const wallet = new hre.ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const contractAddr: string = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const contract = new hre.ethers.Contract(contractAddr, Library.abi, wallet); //can do provider if just making calls

    console.log("Creating 2 books");
    await contract.addNewBooks(1, "Name of Book", 3);
    await contract.addNewBooks(2, "The Bookening", 1);

    console.log("Getting all books and displaying some info");
    const books: Library.BookStructOutput[] = await contract.getAllAvailableBooks();
    console.log(books.length);
    console.log(books[1].bookName);

    console.log("Borrowing and checking if book is indeed borrowed");
    const book: Library.BookStructOutput = await contract.borrowBook(2);
    console.log("Book info: ", book.bookId, " ", book.bookName); //undefined??
    const isRented: boolean = await contract.isCurrentlyBorrowingBook(2);
    console.log("Is rented: ", isRented);

    console.log("Returns book");
    await contract.returnBook(book); //cannot return?
    const isReturned: boolean = await contract.isCurrentlyBorrowingBook(2);
    console.log("Is returned: ", !isReturned);
    console.log("finale");
}

run()