const express = require('express')
const path = require('path')

const bcrypt = require('bcrypt')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  const getDetails = request.body

  const {username, name, password, gender, location} = getDetails
  const hashedPassword = await bcrypt.hash(request.body.password, 10)

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`
      const dbResponse = await db.run(createUserQuery)
      const newUserId = dbResponse.lastID
      response.send(`User created successfully`)
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const getDetails = request.body

  const {username, password} = getDetails

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const PasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (PasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const getDetails = request.body

  const {username, oldPassword, newPassword} = getDetails

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const PasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (PasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updateUserQuery = `
          UPDATE 
            user 
          SET password = '${hashedPassword}'
          WHERE username = '${username}'`
        const dbResponse = await db.run(updateUserQuery)
        response.status(200)
        response.send(`Password updated`)
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

// const pass = "1234"

// let res = bcrypt.hash(pass,10)

// res.then((response) =>{
//   console.log(response)
// })

module.exports = app
