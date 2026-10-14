import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateVendorDto,
  UpdateVendorDto,
  CreatePackingDto,
  UpdatePackingDto,
} from '../../common/dto/create-master.dto';

@ApiTags('masters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  // ========== CATEGORIES ==========
  // Category list endpoints
  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  getCategories(@CurrentUser() user: any) {
    return this.mastersService.findAllCategories(user);
  }

  @Get('categories/paginated')
  @ApiOperation({ summary: 'Get categories with pagination' })
  getCategoriesPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllCategoriesPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createCategory(dto, user);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateCategory(id, dto, user);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  deleteCategory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteCategory(id, user);
  }

  // ========== SEGMENTS ==========
  @Get('segments')
  @ApiOperation({ summary: 'Get all product segments' })
  getSegments(@CurrentUser() user: any) {
    return this.mastersService.findAllSegments(user);
  }

  // ========== COMPONENT GROUPS ==========
  @Get('groups')
  @ApiOperation({ summary: 'Get all component groups' })
  getGroups(@CurrentUser() user: any) {
    return this.mastersService.findAllGroups(user);
  }

  // ========== BRANDS ==========
  @Get('brands')
  @ApiOperation({ summary: 'Get all brands' })
  getBrands(@CurrentUser() user: any) {
    return this.mastersService.findAllBrands(user);
  }

  @Get('brands/paginated')
  @ApiOperation({ summary: 'Get brands with pagination' })
  getBrandsPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllBrandsPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('brands')
  @ApiOperation({ summary: 'Create a new brand' })
  createBrand(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createBrand(dto, user);
  }

  @Patch('brands/:id')
  @ApiOperation({ summary: 'Update a brand' })
  updateBrand(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateBrand(id, dto, user);
  }

  @Delete('brands/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a brand (soft delete)' })
  deleteBrand(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteBrand(id, user);
  }

  // ========== ZONES ==========
  @Get('zones')
  @ApiOperation({ summary: 'Get all zones' })
  getZones(@CurrentUser() user: any) {
    return this.mastersService.findAllZones(user);
  }

  @Get('zones/paginated')
  @ApiOperation({ summary: 'Get zones with pagination' })
  getZonesPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllZonesPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('zones')
  @ApiOperation({ summary: 'Create a new zone' })
  createZone(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createZone(dto, user);
  }

  @Patch('zones/:id')
  @ApiOperation({ summary: 'Update a zone' })
  updateZone(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateZone(id, dto, user);
  }

  @Delete('zones/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a zone' })
  deleteZone(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteZone(id, user);
  }

  // ========== LOCATIONS ==========
  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  getLocations(@CurrentUser() user: any) {
    return this.mastersService.findAllLocations(user);
  }

  @Get('locations/paginated')
  @ApiOperation({ summary: 'Get locations with pagination' })
  getLocationsPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllLocationsPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('locations')
  @ApiOperation({ summary: 'Create a new location' })
  createLocation(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createLocation(dto, user);
  }

  @Patch('locations/:id')
  @ApiOperation({ summary: 'Update a location' })
  updateLocation(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateLocation(id, dto, user);
  }

  @Delete('locations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a location' })
  deleteLocation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteLocation(id, user);
  }

  // ========== PAYMENT TERMS ==========
  @Get('payment-terms')
  @ApiOperation({ summary: 'Get all payment terms' })
  getPaymentTerms(@CurrentUser() user: any) {
    return this.mastersService.findAllPaymentTerms(user);
  }

  @Get('payment-terms/paginated')
  @ApiOperation({ summary: 'Get payment terms with pagination' })
  getPaymentTermsPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllPaymentTermsPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('payment-terms')
  @ApiOperation({ summary: 'Create a new payment term' })
  createPaymentTerm(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createPaymentTerm(dto, user);
  }

  @Patch('payment-terms/:id')
  @ApiOperation({ summary: 'Update a payment term' })
  updatePaymentTerm(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updatePaymentTerm(id, dto, user);
  }

  @Delete('payment-terms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a payment term' })
  deletePaymentTerm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deletePaymentTerm(id, user);
  }

  // ========== CURRENCIES ==========
  @Get('currencies')
  @ApiOperation({ summary: 'Get all currencies (paginated)' })
  getCurrencies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    if (page || limit || search) {
      return this.mastersService.findAllCurrenciesPaginated({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search,
      }, user);
    }
    return this.mastersService.findAllCurrencies(user);
  }

  @Post('currencies')
  @ApiOperation({ summary: 'Create a new currency' })
  createCurrency(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createCurrency(dto, user);
  }

  @Patch('currencies/:id')
  @ApiOperation({ summary: 'Update a currency' })
  updateCurrency(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateCurrency(id, dto, user);
  }

  @Delete('currencies/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a currency' })
  deleteCurrency(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteCurrency(id, user);
  }

  // ========== CURRENCY RATES ==========
  @Get('currency-rates')
  @ApiOperation({ summary: 'Get all currency rates' })
  getCurrencyRates(@CurrentUser() user: any) {
    return this.mastersService.findAllCurrencyRates(user);
  }

  @Post('currency-rates')
  @ApiOperation({ summary: 'Create a new currency rate' })
  createCurrencyRate(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createCurrencyRate(dto, user);
  }

  @Patch('currency-rates/:id')
  @ApiOperation({ summary: 'Update a currency rate' })
  updateCurrencyRate(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateCurrencyRate(id, dto, user);
  }

  @Delete('currency-rates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a currency rate' })
  deleteCurrencyRate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteCurrencyRate(id, user);
  }

  // ========== PRODUCTS ==========

  // PRODUCT REVIEW WORKFLOW - Must come before /:id routes
  @Get('products/pending-reviews')
  @ApiOperation({ summary: 'Get products pending Purchase review (manual entries from sales)' })
  getPendingProductReviews(@CurrentUser() user: any) {
    return this.mastersService.getPendingProductReviews(user);
  }

  @Get('products/pending-mis-review')
  @ApiOperation({ summary: 'Get products pending MIS review' })
  getPendingMisReviews(@CurrentUser() user: any) {
    return this.mastersService.getPendingMisReviews(user);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'segmentId', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, type: String })
  @ApiQuery({ name: 'productStatus', required: false, type: String })
  getProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('segmentId') segmentId?: string,
    @Query('source') source?: string,
    @Query('productStatus') productStatus?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllProducts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      categoryId,
      segmentId,
      source,
      productStatus,
    }, user);
  }

  @Get('products/sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  getProductBySku(@Param('sku') sku: string, @CurrentUser() user: any) {
    return this.mastersService.findProductBySku(sku, user);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.mastersService.createProduct(dto, user?.userId, user);
  }

  @Post('products/manual')
  @ApiOperation({ summary: 'Create a temporary/manual product from sales enquiry' })
  @ApiResponse({ status: 201, description: 'Manual product created' })
  createManualProduct(
    @Body() body: {
      manualProductName: string;
      enquiryId: string;
      enquiryNo: string;
      remarks?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.mastersService.createManualProduct(
      body.manualProductName,
      body.enquiryId,
      body.enquiryNo,
      user?.userId,
      body.remarks,
      user,
    );
  }

  @Post('products/generate-sku')
  @ApiOperation({ summary: 'Generate a new SKU' })
  generateSku(
    @Body() body: {
      brandName?: string;
      locationName?: string;
      productName?: string;
      unitSize?: string;
      packingSize?: string;
      categoryCode?: string;
      segmentCode?: string;
      groupCode?: string;
    },
  ) {
    if (!body.brandName && body.categoryCode) {
      return this.mastersService.generateSkuLegacy(
        body.categoryCode,
        body.segmentCode,
        body.groupCode,
      ).then((sku) => ({ sku }));
    }
    return this.mastersService.generateSku(
      body.brandName || '',
      body.locationName || '',
      body.productName || 'PRODUCT',
      body.unitSize || '',
      body.packingSize || '',
    ).then((sku) => ({ sku }));
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  getProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.findProductById(id, user);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    return this.mastersService.updateProduct(id, dto, user);
  }

  @Patch('products/:id/review')
  @ApiOperation({ summary: 'Purchase team reviews and either maps to existing product or submits to MIS' })
  reviewProduct(
    @Param('id') id: string,
    @Body() body: {
      action: 'map_existing' | 'submit_to_mis';
      existingProductId?: string;
      categoryId?: string;
      brandId?: string;
      vendorId?: string;
      unitSize?: string;
      unitsPerCarton?: number;
      cbmPerBox?: number;
      buyingPrice?: number;
      purchasePersonId?: string;
      remarks?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.mastersService.reviewProduct(id, body, user?.userId);
  }

  @Patch('products/:id/mis-review')
  @ApiOperation({ summary: 'MIS reviews and approves/rejects the product' })
  misReviewProduct(
    @Param('id') id: string,
    @Body() body: {
      action: 'approve' | 'reject';
      categoryId?: string;
      segmentId?: string;
      groupId?: string;
      brandId?: string;
      uomId?: string;
      gstRateId?: string;
      unitSize?: string;
      unitsPerCarton?: number;
      cbmPerBox?: number;
      conversionRatio?: number;
      locationId?: string;
      remarks?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.mastersService.misReviewProduct(id, body, user?.userId, user);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteProduct(id, user);
  }

  // ========== GST RATES ==========
  @Get('gst-rates')
  @ApiOperation({ summary: 'Get all GST rates' })
  getGstRates(@CurrentUser() user: any) {
    return this.mastersService.findAllGstRates(user);
  }

  @Get('gst-rates/paginated')
  @ApiOperation({ summary: 'Get GST rates with pagination' })
  getGstRatesPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllGstRatesPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('gst-rates')
  @ApiOperation({ summary: 'Create a new GST rate' })
  createGstRate(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createGstRate(dto, user);
  }

  @Patch('gst-rates/:id')
  @ApiOperation({ summary: 'Update a GST rate' })
  updateGstRate(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateGstRate(id, dto, user);
  }

  @Delete('gst-rates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a GST rate' })
  deleteGstRate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteGstRate(id, user);
  }

  // ========== PORTS ==========
  @Get('ports')
  @ApiOperation({ summary: 'Get all ports' })
  getPorts(@CurrentUser() user: any) {
    return this.mastersService.findAllPorts(user);
  }

  @Get('ports/paginated')
  @ApiOperation({ summary: 'Get ports with pagination' })
  getPortsPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllPortsPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('ports')
  @ApiOperation({ summary: 'Create a new port' })
  createPort(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createPort(dto, user);
  }

  @Patch('ports/:id')
  @ApiOperation({ summary: 'Update a port' })
  updatePort(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updatePort(id, dto, user);
  }

  @Delete('ports/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a port' })
  deletePort(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deletePort(id, user);
  }

  // ========== UOM ==========
  @Get('uoms')
  @ApiOperation({ summary: 'Get all units of measure' })
  getUoms(@CurrentUser() user: any) {
    return this.mastersService.findAllUoms(user);
  }

  @Get('uoms/paginated')
  @ApiOperation({ summary: 'Get UOMs with pagination' })
  getUomsPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllUomsPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('uoms')
  @ApiOperation({ summary: 'Create a new UOM' })
  createUom(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createUom(dto, user);
  }

  @Patch('uoms/:id')
  @ApiOperation({ summary: 'Update a UOM' })
  updateUom(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateUom(id, dto, user);
  }

  @Delete('uoms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a UOM' })
  deleteUom(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteUom(id, user);
  }

  // ========== FREIGHT RATES ==========
  @Get('freight-rates')
  @ApiOperation({ summary: 'Get all freight rates' })
  getFreightRates(@CurrentUser() user: any) {
    return this.mastersService.findAllFreightRates(user);
  }

  @Get('freight-rates/paginated')
  @ApiOperation({ summary: 'Get freight rates with pagination' })
  getFreightRatesPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllFreightRatesPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('freight-rates')
  @ApiOperation({ summary: 'Create a new freight rate' })
  createFreightRate(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createFreightRate(dto, user);
  }

  @Patch('freight-rates/:id')
  @ApiOperation({ summary: 'Update a freight rate' })
  updateFreightRate(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateFreightRate(id, dto, user);
  }

  @Delete('freight-rates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a freight rate' })
  deleteFreightRate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteFreightRate(id, user);
  }

  // ========== HAULAGE ==========
  @Get('haulage')
  @ApiOperation({ summary: 'Get all haulage charges' })
  getHaulage(@CurrentUser() user: any) {
    return this.mastersService.findAllHaulage(user);
  }

  @Get('haulage/paginated')
  @ApiOperation({ summary: 'Get haulage charges with pagination' })
  getHaulagePaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllHaulagePaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('haulage')
  @ApiOperation({ summary: 'Create a new haulage charge' })
  createHaulage(@Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.createHaulage(dto, user);
  }

  @Patch('haulage/:id')
  @ApiOperation({ summary: 'Update a haulage charge' })
  updateHaulage(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.mastersService.updateHaulage(id, dto, user);
  }

  @Delete('haulage/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a haulage charge' })
  deleteHaulage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteHaulage(id, user);
  }

  // ========== PACKING ==========
  @Get('packing')
  @ApiOperation({ summary: 'Get all packing masters with pagination' })
  getPacking(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllPacking({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Get('packing/:id')
  @ApiOperation({ summary: 'Get packing master by ID' })
  getPackingById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.findPackingById(id, user);
  }

  @Post('packing')
  @ApiOperation({ summary: 'Create a new packing master' })
  createPacking(@Body() dto: CreatePackingDto, @CurrentUser() user: any) {
    return this.mastersService.createPacking(dto, user);
  }

  @Patch('packing/:id')
  @ApiOperation({ summary: 'Update a packing master' })
  updatePacking(@Param('id') id: string, @Body() dto: UpdatePackingDto, @CurrentUser() user: any) {
    return this.mastersService.updatePacking(id, dto, user);
  }

  @Delete('packing/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a packing master' })
  deletePacking(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deletePacking(id, user);
  }

  // ========== VENDORS ==========
  @Get('vendors')
  @ApiOperation({ summary: 'Get all vendors with pagination' })
  getVendors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllVendors({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  getVendor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.findVendorById(id, user);
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Create a new vendor' })
  createVendor(@Body() dto: CreateVendorDto, @CurrentUser() user: any) {
    return this.mastersService.createVendor(dto, user);
  }

  @Patch('vendors/:id')
  @ApiOperation({ summary: 'Update a vendor' })
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto, @CurrentUser() user: any) {
    return this.mastersService.updateVendor(id, dto, user);
  }

  @Delete('vendors/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a vendor' })
  deleteVendor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteVendor(id, user);
  }

  // ========== CUSTOMERS ==========
  @Get('customers')
  @ApiOperation({ summary: 'Get all customers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'zone', required: false, type: String })
  getCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('zone') zone?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllCustomers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      zone,
    }, user);
  }

  @Get('customers/generate-code')
  @ApiOperation({ summary: 'Generate a new buyer code' })
  generateBuyerCode() {
    return this.mastersService.generateCustomerBuyerCode();
  }

  @Get('customers/buyer-code/:buyerCode')
  @ApiOperation({ summary: 'Get customer by buyer code' })
  getCustomerByBuyerCode(@Param('buyerCode') buyerCode: string, @CurrentUser() user: any) {
    return this.mastersService.findCustomerByBuyerCode(buyerCode, user);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer by ID' })
  getCustomer(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.findCustomerById(id, user);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  createCustomer(@Body() dto: CreateCustomerDto, @CurrentUser() user: any) {
    return this.mastersService.createCustomer(dto, user?.userId, user);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update a customer' })
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: any) {
    return this.mastersService.updateCustomer(id, dto, user);
  }

  @Delete('customers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a customer (soft delete)' })
  deleteCustomer(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mastersService.deleteCustomer(id, user);
  }


  // ========== COUNTRIES ==========
  @Get('countries')
  @ApiOperation({ summary: 'Get all countries' })
  getCountries(@CurrentUser() user: any) {
    return this.mastersService.findAllCountries(user);
  }

  @Get('countries/paginated')
  @ApiOperation({ summary: 'Get countries with pagination' })
  getCountriesPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllCountriesPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    }, user);
  }

  @Post('countries')
  @ApiOperation({ summary: 'Create a new country' })
  createCountry(@Body() dto: any, @CurrentUser() user?: any) {
    return this.mastersService.createCountry(dto, user);
  }

  @Patch('countries/:id')
  @ApiOperation({ summary: 'Update a country' })
  updateCountry(@Param('id') id: string, @Body() dto: any, @CurrentUser() user?: any) {
    return this.mastersService.updateCountry(id, dto, user);
  }

  @Delete('countries/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a country' })
  deleteCountry(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.mastersService.deleteCountry(id, user);
  }
}
