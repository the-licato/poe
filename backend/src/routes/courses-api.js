const express = require('express')
const bodyParser = require('body-parser')
const coursesSchema = require('../schemas/courses-schema')
const coursesRouter = express.Router()
coursesRouter.use(bodyParser.json())
coursesRouter.use(bodyParser.urlencoded({extended:false}))
/*
coursesRouter.post(
  "/createCourse",

)
*/
module.exports = coursesRouter