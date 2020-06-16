'use strict';

const express = require('express');
const app = express();
const pg = require('pg');

require('ejs');
require('dotenv').config();

const superagent = require('superagent');

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
// app.set("views", path.results(__dirname, 'public'));

app.use(express.static('public'));
// app.use(express.static(__dirname + 'views'));



app.get('/', getBooks);
// app.get('/', (req, res) => {
//   res.status(200).render('pages/index.ejs');
// });

app.get('/searches', (request, response) => {
  response.status(200).render('./searches/new.ejs');
})

function getBooks(request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows;
      // Count for number of books in database
      console.log(books.length);
      response.status(200).render('pages/index.ejs', { myBookShelf: books })
    })
}





app.post('/searches', (request, response) => {
  try {
    // console.log(request.body.search);

    let query = request.body.search[0];
    let titleOrAuthor = request.body.search[1];

    let url = 'https://www.googleapis.com/books/v1/volumes?q=';

    if (titleOrAuthor === 'title') {
      url += `intitle:${query}`;
    } else if (titleOrAuthor === 'author') {
      url += `+inauthor:${query}`;
    }

    superagent.get(url)
      .then(results => {
        // console.log(results.body.items);

        let bookArray = results.body.items;

        const finalBookArray = bookArray.map(book => {
          return new Book(book.volumeInfo);
        });

        // console.log(finalBookArray.length);
        response.status(200).render('searches/show.ejs', { searchResults: finalBookArray })

      })
  } catch (err) {
    console.log('ERROR', err);
    response.status(500).send('Sorry, there is an error');
  }
});


function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors : 'no author available';
  this.isbn = info.industryIdentifiers[1] ? info.industryIdentifiers[1] : 'no ISBN avialable';
  this.image = info.imageLinks ? info.imageLinks.smallThumbnail : placeholderImage;
  this.description = info.description ? info.description : 'no description available';
}

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
});


const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log(err));
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  });
