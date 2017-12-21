module.exports.getQuery = function (callNumber){
  return "select col1, col2 where call_number = '" + callNumber + "'";
}

