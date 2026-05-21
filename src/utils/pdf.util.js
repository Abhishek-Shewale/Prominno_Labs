const PDFDocument = require('pdfkit');

const generateProductPDF = (product, res) => {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${product.productName.replace(/\s+/g, '_')}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text(product.productName, { align: 'center' });
    doc.moveDown();

    // Description
    doc.fontSize(12).font('Helvetica').text('Description:', { underline: true });
    doc.text(product.description);
    doc.moveDown(2);

    let totalPrice = 0;

    // Brands
    doc.fontSize(16).font('Helvetica-Bold').text('Brands');
    doc.moveDown();

    product.brands.forEach((brand, index) => {
        totalPrice += brand.price;

        doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${brand.brandName}`);
        doc.fontSize(12).font('Helvetica').text(`Detail: ${brand.detail}`);
        doc.text(`Price: $${brand.price}`);
        
        // Note: For actual image rendering, we would need to check if the file exists locally
        // and add it using doc.image(brand.image, ...). However, since we are returning URL strings
        // or path strings that might not be easily accessible synchronously for pdfkit, we'll
        // display the image path/url for now, or you'd fetch it/read it from disk.
        doc.text(`Image: ${brand.image}`);
        
        doc.moveDown();
    });

    // Total Price
    doc.moveDown(2);
    doc.fontSize(18).font('Helvetica-Bold').text(`Total Price: $${totalPrice}`, { align: 'right' });

    doc.end();
};

module.exports = {
    generateProductPDF,
};
