exports.checkPayment = async (req, res) => {

    const phone = req.params.phone;

    console.log("Checking payment for:", phone);

    // Later we'll check MongoDB here.

    res.json({
        status: "pending"
    });

};