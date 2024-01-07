const db = require("../models");
const Information = db.information;

exports.getInformation = async (req, res) => {
  try {
    const informations = await Information.find({});
    return res.json(informations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createInformation = async (req, res) => {
  const { infoName, description } = req.body;

  try {
    const informations = await Information.create({
      informationName: infoName,
      description: description,
    });

    return res.json(informations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateInformation = async (req, res) => {
  try {
    const { informationName, description } = req.query;
    const updatedInformation = await Information.findOneAndUpdate(
      { informationName },
      { description },
      { new: true }
    );
    return res.json(updatedInformation);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteInformation = async (req, res) => {
  const filter = req.query;

  try {
    const deletedInformations = await Information.deleteMany({
      informationName: filter.informationName,
    });

    return res.json(deletedInformations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
