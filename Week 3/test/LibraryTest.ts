import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { Library } from "../typechain-types";

describe("Library", function () {
  const DEFAULT_TEST_ID: number = 1;
  const DEFAULT_TEST_BOOK_NAME: string = "The Fall of Lordaeron";
  const DEFAULT_TEST_COPY_AMOUNT: number = 12;

   //let library: Library;

  // this.beforeEach(async () => {
  //   try {
  //     const [owner, addr1, addr2] = await ethers.getSigners();

  //     const Library = await ethers.getContractFactory('Library');
  //     library = await Library.deploy();
  //   }
  //   catch (error) {
  //     console.log(error);
  //   }
  // })

  it('should add new books', async () => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await expect(library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT)).to.emit(library, "NewBookAdded");
    await library.addNewBook(2, "Beyond the Dark Portal", 32);

    expect(await library.countOfAvailableBooks()).to.equal(2);
  })

  it('should FAIL adding new books', async () => {
    const [owner, addr1] = await ethers.getSigners();
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);
    await expect(library.connect(addr1).addNewBook(2, "Silvermoon", 3)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(library.addNewBook(DEFAULT_TEST_ID, "The Sundering", DEFAULT_TEST_COPY_AMOUNT)).to.be.revertedWith("This index already exists.");
    await expect(library.addNewBook(2, "The Frozen Throne", 0)).to.be.revertedWith("Cannot add books with zero copies.");
  })

  it('should add copies to existing books', async () => {    
    const TEST_ADDITIONAL_COPIES_AMOUNT: number = 10;
 
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);
    expect(await library.countOfAvailableBooks()).to.equal(1);

    await library.borrowBook(DEFAULT_TEST_ID);
    const book: Library.BookStructOutput = await library.getBorrowedBook(DEFAULT_TEST_ID);
    expect (book.availableCopies).to.equal(DEFAULT_TEST_COPY_AMOUNT - 1);

    await expect(library.addCopiesToExistingBook(DEFAULT_TEST_ID, TEST_ADDITIONAL_COPIES_AMOUNT)).to.emit(library, "CopiesAddedToBook");
    const updatedBook: Library.BookStructOutput = await library.getBorrowedBook(DEFAULT_TEST_ID);
    expect (await updatedBook.availableCopies).to.equal(book.availableCopies.toNumber() + TEST_ADDITIONAL_COPIES_AMOUNT);
  })

  it('should FAIL adding copies', async () => {
    const [owner, addr1] = await ethers.getSigners();
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);
    await expect(library.connect(addr1).addCopiesToExistingBook(DEFAULT_TEST_ID, 10)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(library.addCopiesToExistingBook(5, 10)).to.be.revertedWithCustomError(Library, 'InvalidBookIndex');
  })

  it('should borrow book', async () => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);

    await expect(library.borrowBook(DEFAULT_TEST_ID)).to.emit(library, "BookBorrowed");
    const book: Library.BookStructOutput = await library.getBorrowedBook(DEFAULT_TEST_ID);
    expect(book.bookId).to.equal(DEFAULT_TEST_ID);
    expect(book.bookName).to.equal(DEFAULT_TEST_BOOK_NAME);
    expect(book.availableCopies).to.equal(DEFAULT_TEST_COPY_AMOUNT - 1);
  })

  it('should FAIL borrowing', async () => {
    const [owner, addr1] = await ethers.getSigners();
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await expect(library.borrowBook(DEFAULT_TEST_ID)).to.be.revertedWithCustomError(Library, 'InvalidBookIndex');
    
    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, 1);
    await library.borrowBook(DEFAULT_TEST_ID);
    await expect(library.borrowBook(DEFAULT_TEST_ID)).to.be.revertedWithCustomError(Library, 'CannotBorrowMoreCopies');

    await expect(library.connect(addr1).borrowBook(DEFAULT_TEST_ID)).to.be.revertedWithCustomError(Library, 'NoCopiesAvailable');
    
    await expect(library.connect(addr1).getBorrowedBook(DEFAULT_TEST_ID)).to.be.revertedWithCustomError(Library, 'Unauthorized');
  })

  it('should return book', async () => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);
    await library.borrowBook(DEFAULT_TEST_ID);
    await expect(library.returnBook(DEFAULT_TEST_ID)).to.emit(library, "BookReturned");

    await expect(library.isCurrentlyBorrowingBook(2)).to.be.revertedWithCustomError(Library, 'InvalidBookIndex');
    expect(await library.isCurrentlyBorrowingBook(DEFAULT_TEST_ID)).to.equal(false);    
  })

  it('should FAIL returning book', async () => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    const book: Library.BookStruct = {
      bookId : DEFAULT_TEST_ID,
      bookName : DEFAULT_TEST_BOOK_NAME,
      availableCopies : DEFAULT_TEST_COPY_AMOUNT,
      allBorrowers : []
    };
    await expect(library.returnBook(DEFAULT_TEST_ID)).to.be.revertedWithCustomError(Library, 'InvalidBookIndex');

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);
    expect(library.returnBook(DEFAULT_TEST_ID)).to.be.revertedWithCustomError(Library, 'NoCopiesOwned');
  })

  it('should change count of books when borrowing/returning low copy books', async() => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, 1);
    expect(await library.countOfAvailableBooks()).to.equal(1);

    await library.borrowBook(DEFAULT_TEST_ID);
    expect(await library.countOfAvailableBooks()).to.equal(0);

    await library.returnBook(DEFAULT_TEST_ID);
    expect(await library.countOfAvailableBooks()).to.equal(1);
  })

  it('should increase book count when adding copies to 0 copy book', async() => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, 1);
    expect(await library.countOfAvailableBooks()).to.equal(1);

    await library.borrowBook(DEFAULT_TEST_ID);
    expect(await library.countOfAvailableBooks()).to.equal(0);

    await library.addCopiesToExistingBook(DEFAULT_TEST_ID, 1);
    expect(await library.countOfAvailableBooks()).to.equal(1);
  })

  it('should get all book IDs', async() => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, DEFAULT_TEST_COPY_AMOUNT);
    await library.addNewBook(3, "3", 3);

    const ids: BigNumber[] = await library.getAllBookIDs();

    expect(ids.length).to.equal(2);
    expect(ids[0]).to.equal(DEFAULT_TEST_ID);
    expect(ids[1]).to.equal(3);
  })

  it('should check if book is available', async() => {
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();

    await library.addNewBook(DEFAULT_TEST_ID, DEFAULT_TEST_BOOK_NAME, 1);
    await expect (library.isBookAvailable(2)).to.be.revertedWithCustomError(Library, 'InvalidBookIndex');
    expect(await library.isBookAvailable(DEFAULT_TEST_ID)).to.equal(true);

    await library.borrowBook(DEFAULT_TEST_ID);
    expect(await library.isBookAvailable(DEFAULT_TEST_ID)).to.equal(false);
  })
});
