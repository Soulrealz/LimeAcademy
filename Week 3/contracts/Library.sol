// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Library is Ownable {
    struct Book { 
        uint bookId;
        uint availableCopies;
        string bookName;
        address[] allBorrowers;      
    }

    mapping(uint => Book) private __idToBook;
    mapping(uint => mapping(address => bool)) bookAddressesCurrentlyBorrowing;
    uint[] private __bookIds;

    uint public countOfAvailableBooks;

    error InvalidBookIndex();
    error Unauthorized();
    error NoCopiesAvailable();
    error CannotBorrowMoreCopies();
    error NoCopiesOwned();

    event NewBookAdded(uint bookId, string bookName);
    event CopiesAddedToBook(uint bookId, uint newCopiesAmount);
    event BookBorrowed(uint bookId, string bookName, uint availableCopies);
    event BookReturned(uint bookId);


    modifier onlyExistingIndex(uint _bookId) {
        if (__idToBook[_bookId].bookId == 0) {
            revert InvalidBookIndex(); 
        }
        _;
    }

    constructor() {
        countOfAvailableBooks = 0;
    }

    function addNewBook(uint _bookId, string calldata _bookName, uint _copies) public onlyOwner {
        require(__idToBook[_bookId].bookId == 0, "This index already exists.");
        require(_copies > 0, "Cannot add books with zero copies.");

        address[] memory empty;
        __idToBook[_bookId] = Book(_bookId, _copies, _bookName, empty);
        __bookIds.push(_bookId);
        countOfAvailableBooks++;

        emit NewBookAdded(_bookId, _bookName);
    }

    function addCopiesToExistingBook(uint _bookId, uint _copies) public onlyOwner onlyExistingIndex(_bookId) {
        require(_copies > 0, "Cannot add books with zero copies.");
        if (__idToBook[_bookId].availableCopies == 0) {
            countOfAvailableBooks++;
        }

        __idToBook[_bookId].availableCopies += _copies;

        emit CopiesAddedToBook(_bookId, __idToBook[_bookId].availableCopies);
    }

    //TODO: REMOVE
    function getAllAvailableBooks() public view returns(Book[] memory available) {
        available = new Book[](countOfAvailableBooks);
        uint availableCounter = 0;
        for (uint i = 0; i < __bookIds.length; ++i) {
            Book memory book = __idToBook[__bookIds[i]];
            if (book.availableCopies > 0) {
                available[availableCounter++] = book;
            }
        }
    }

    function borrowBook(uint _bookId) external onlyExistingIndex(_bookId) {
        if (bookAddressesCurrentlyBorrowing[_bookId][msg.sender] == true) {
            revert CannotBorrowMoreCopies();
        }

        if (__idToBook[_bookId].availableCopies <= 0) {
            revert NoCopiesAvailable();
        }

        __idToBook[_bookId].availableCopies--;
        if (__idToBook[_bookId].availableCopies == 0) {
            countOfAvailableBooks--;
        }

        __idToBook[_bookId].allBorrowers.push(msg.sender);
        bookAddressesCurrentlyBorrowing[_bookId][msg.sender] = true;  

        emit BookBorrowed(_bookId, __idToBook[_bookId].bookName, __idToBook[_bookId].availableCopies);      
    }

    function getBorrowedBook(uint _bookId) external view returns(Book memory) {
        if (bookAddressesCurrentlyBorrowing[_bookId][msg.sender] != true) {
            revert Unauthorized();
        }

        return __idToBook[_bookId];
    }

    function returnBook(uint _bookId) external onlyExistingIndex(_bookId) {
        if (bookAddressesCurrentlyBorrowing[_bookId][msg.sender] == false) {
            revert NoCopiesOwned();
        }

        __idToBook[_bookId].availableCopies++;
        if (__idToBook[_bookId].availableCopies == 1) {
            countOfAvailableBooks++;
        }
        bookAddressesCurrentlyBorrowing[_bookId][msg.sender] = false;

        emit BookReturned(_bookId);
    }

    function isCurrentlyBorrowingBook(uint _bookId) external view returns (bool) {
        return bookAddressesCurrentlyBorrowing[_bookId][msg.sender];
    }
}