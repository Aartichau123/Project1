const blogModel = require("../Models/blogModel")
const authorModel = require("../Models/authorModel")
const moment = require('moment')
const jwt = require("jsonwebtoken");

function stringVerify(value) {
  if (typeof value !== "string" || value.length == 0) {
    return false
  }
  return true;
}
const createBlog = async function (req, res) {
  try {
    let data = req.body;
    if (Object.keys(data).length == 0) {
      return res.status(400).send({ msg: "Please Enter details" })
    }
    let { title, body, authorId, tags, category, subCategory, isPublished } = data

    if (!stringVerify(title)) {
      return res.status(400).send({ err: "Title is required" })
    }

    if (!stringVerify(body)) {
      return res.status(400).send({ err: "invailed body formet" })
    }
    if (!stringVerify(authorId)) {
      return res.status(400).send({ err: "authorID is required" })
    }
    let authid = await authorModel.findById(data.authorId)

    if (!authid) {
      return res.status(400).send({ err: "invalid authorid " })
    }

    if (!stringVerify(category)) {
      return res.status(400).send({ err: "category is required" })
    }


    if (typeof isPublished !== "boolean") {
      return res.status(400).send({ status: false, msg: "is Published input is needed" })
    }

    if (typeof (tags && subCategory) !== "object") {
      return res.status(400).send({ status: false, msg: "tags/subcategory should be in array of string only" })
    }

    let savedData = await blogModel.create(data);
    res.status(201).send({ msg: savedData });

  } catch (err) {
    console.log("this is the error :", err.message)
    res.status(500).send({ msg: "Error", error: err.message })
  }

};

const getBlog = async function (req, res) {
  try {
    let allblog = req.query
    let { authorId, category } = allblog

    let blogDetails = await blogModel.find({ $and: [{ isDeleted: false, isPublished: true }, allblog] })
    if (blogDetails == 0) {
      return res.status(404).send({ msg: "blog not found" })
    }
    else {
      res.status(200).send({ data: blogDetails })
    }
  } catch (err) {
   // console.log("this is the error :", err.message)
    res.status(500).send({ msg: "Error", error: err.message })
  }
}

const updateBlog = async function (req, res) {
  try {
    const Data = req.body;
    const blogId = req.params.blogId;

    if (!blogId) {
      return res.status(404).send({ status: false, msg: "BlogId is not found" })
    }
    const updateData = await blogModel.findOneAndUpdate(
      { _id: blogId, isDeleted: false },
      {
        $set: { title: Data.title, body: Data.body, isPublished: true, publishedAt: new Date() },
        $push: { subCategory: req.body.subCategory, tags: req.body.tags },
      },
      { new: true }
    )
    return res.status(200).send({ status: true, data: updateData })
  }
  catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}

const deleteBlog = async function (req, res) {
  try {
    let blogId = req.params.blogId
    let blogData = await blogModel.findById({ _id: blogId })
    if (!blogData) {
      res.status(404).send({ msg: "Does not found any blogg with this id" })
    }
    let deletKey = blogData.isDeleted
    if (deletKey != true) {
      let byf = await blogModel.findOneAndUpdate({ _id: blogId  }, { $set: { isDeleted: true } }, { new: true })
      res.status(200).send({ data: byf, msg: "deleted successufully" })
    } else {
      res.status(200).send({ msg: "already deleted" })
    }
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message })
  }
}




const deleteByQuery = async function (req, res) {

  try {
    const { category, subcategory, tag, authorId } = req.query
    if (!category && !subcategory && !tag && !authorId) {
      return res.status(400).send({ status: true, message: 'query does not exist' })
    }
    const getAllBlogs = await blogModel.find({ $or: [{ category: category }, { subcategory: subcategory }, { tags: tag }, { _id: authorId }], isDeleted: true })
    if (getAllBlogs.length == 0) {
      return res.status(404).send({ status: false, message: 'allready deleted' })
    }
    const getBlog = await blogModel.updateMany({ $or: [{ category: category }, { subcategory: subcategory }, { tags: tag }, { _id: authorId }], isDeleted: false }, { $set: { isDeleted: true, deletedAt: moment().format() } }, { new: true })

    res.status(200).send({ status: true, msg: 'Deleted successfully ' })


  } catch (error) {
    res.status(500).send({ status: false, msg: error.message })
  }
}

const login= async function(req,res){
  
let mail=req.body.Email
let pass= req.body.password
if(!req.body){
}
let userData= await authorModel.findOne({Email:mail,Password:pass})
if(!userData){
  res.status(400).send({msg:"invalid email or password"})
}
else{
  let token = jwt.sign(
    {
          ID:userData._id.toString()
    },"#group20" );

console.log(userData._id)

    
res.status(201).send({status:true,msg:token})
//res.setheader("x-api-key", token)
  }
}

const middauth=async function(req,res,next){

let token= req.headers["x-api-key"]
if(!token){
  res.status(400).send({msg:"token not present"})
}
let decodedToken = jwt.verify(token, "#group20");

if(!decodedToken){
  res.status(401).send({msg:"token is not valid"})
}
next()
}


module.exports.createBlog = createBlog;
module.exports.getBlog = getBlog;
module.exports.updateBlog = updateBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.deleteByQuery = deleteByQuery;
module.exports.login=login;
module.exports.middauth=middauth;
