import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import AlipaySdk from 'npm:alipay-sdk@3.4.0';
import AlipayFormData from 'npm:alipay-sdk@3.4.0/lib/form.js';

// 支付宝配置
const alipaySdk = new AlipaySdk({
  appId: '2021006120697145',
  privateKey: `MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCWzCSxF4rCGllKMMecnTsYqzmBToJHcUiphhocNzUsuGarOSsv/hkB3R+Ai3lQEty1c0i/mZkDcrsbtLbc23xu0SCbg+x5g+HYreCVLnM/++nZNJyRgy+mSQty6vJGnRCwr+ZJM4frok7CDkhXsj7zglduxc8Wv8H7LfqZp95wdW57SdPkwjWWHAQWCPz0ybAFz8ku/wNU6npGMU5kWKOaXlPsVZ4EOwJIJSiH20sRyWOuOZ8BRigL3gesWzALgoJx7fUxBYMxUxQ+eyY59qqQYwaCho1dVXAjc4C8GQ8BIFJhgME+K69QuHw6DHwSKSI5KLLj2fcUdcm3f8ziEJt9AgMBAAECggEBAIgS2qE6/yk8IYqDDfzTHLqb954pPAI/xTPEINeJMeCS3YJwafo6rlIyOPUD5opNGwBZcTID5kFoTFMp9UDChjxxVZ0/pCnayfd+n4O+kJ0SMuifQxFDccH5c+1U+R6jKKZnc8RmTaZhpfQSc1E/NPMDkOYSdVav3tlLmjEBfAW5a6qLc8e7/IW18JsbvaRDHwstnI2HdA8zb8WDPxlCQ0fzzwtTgButp6tMtJ7VMZtPApolGj2BERkSABHhsZLd78wQyxfkMkscubxKOPQq9EP+O+M89ADdSzRh8MJq2Fu01R0I92h6Wm0zof5KbYeovykKLmyyXkipLeL83+ZW/3kCgYEA4qWtur6XI1k60ZiIN7GmzQDDS4YDhzsksgwIavX7DQ0phFCD0x/8zY1LPdBDis1rShK75Oig7Eyrirhu0kWuBPRTe1D199piMfLntb3WKXBSjONJTuaMM/R2m6E/PT+KAFQ47a34aYtPgy4jfk2aVmljcq2WGgW9cta4M3EDfjMCgYEAqlO4zBKuROdxfndAKdbDrBgIRpVa9IbTza1slJd+FAJ2MJH29DN6vCHnBC52ygoZNgIjZjnyLjkRL4KT1/B65bQcHs93ijwC0+bVvlMf2mq1gkyh4Dv1vn4CswbwmC4UnaAqwrNRJ7I3M/9LRArHgmC2UY7oc3sZhRVjqw4Hb48CgYAy/whaDmw/XeJoKqPrtCNN2TAYHC1LDjmxfheeyX4Vb7K5vMwMgxQExBf77pJj9th/MDvqw5UB1jZ63gjBc0A2iSsHgi31+MNDbd5I/E/lvwoz/SgPgrxlLEpLtjpec59/d3PfttdAGEJpx8Xgs2FYtBnWQcyWSlhYMIv9tx4MFQKBgQCoB5H+GMu9BAot9dzhqZI9mzPG1h71rnESrey5Jj5l5QvN3KGgxYxmPpfVwzTDGnVGl5NujOnC+d9fXFUXqZDEPQukxY0rXQp5G3dvnDeHVNAdbBYhzWUgeNWW4djGeGc0HUcx7o64N5NIA6mvxWaO03PpP69IBX/mj3RU0rE5NwKBgQDe6e2Ju79jXiTp4UCGZW54yPYr3f3TcRsowaM1HjKZ+oHxYksW/mNyUimUOWDUcqVCUxS/OochQ+TuULSmkqmer/4KX5n0iKxGo3z9MkdZ+LZp+2zlkBsUiEr2WlOrbHmiR8GRMnj2vNuAxLJr6UET5kBQmp9tqkCcBcDEzrz+Qw==`,
  alipayPublicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAva7x+L1H36yXQUGDJYrPrIr5Y1hZnFcrw2BRVJzxeAAMf9gDAxh1DqQztk5krdN2f3Vf4A06/UNR/NQrL9Q4KB2s3qNfgPUdrJ+onLERiGpRVQ/sZ3zEhH19IFIVgSe024SPwjq54sjdTO04P/8thuBK/qidqUSIyUR8lW+dMx41lrJ3aH6kdO7MXPC1moEtMqHIFcQk5M1otiLyo+3GOG7q6FSktIkn/90qHcbu8EfkPdZJbhH531IA6Su/5JBHI0oVvoWOwXxwrxftHJO3yecvsBh33RCuHkcYs5AFm4Ts5NA44v6qispScvud543fGPjLTciAhpW9H2ZmBA3bhwIDAQAB`,
  gateway: 'https://openapi.alipay.com/gateway.do',
  timeout: 5000,
  camelCase: true,
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan, amount } = await req.json();
    
    // 创建订单记录
    const orderNumber = `ALI${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const order = await base44.asServiceRole.entities.PaymentOrder.create({
      user_email: user.email,
      plan: plan,
      amount: amount,
      currency: 'CNY',
      payment_method: 'alipay',
      status: 'pending',
      order_number: orderNumber
    });
    
    // 使用真实支付宝 SDK 创建当面付订单
    const formData = new AlipayFormData();
    formData.setMethod('get');
    
    formData.addField('notifyUrl', `${new URL(req.url).origin}/api/functions/alipayCallback`);
    formData.addField('bizContent', {
      outTradeNo: orderNumber,
      totalAmount: amount.toString(),
      subject: `顶点视角会员-${plan === 'monthly' ? '月度' : plan === 'yearly' ? '年度' : '终身'}`,
      productCode: 'FACE_TO_FACE_PAYMENT',
      qrCodeTimeoutExpress: '15m',
    });

    const result = await alipaySdk.exec(
      'alipay.trade.precreate',
      {},
      { formData }
    );

    if (result.qrCode) {
      // 生成二维码图片URL
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.qrCode)}`;
      
      return Response.json({
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        qr_code: result.qrCode,
        qr_image_url: qrImageUrl,
        amount: amount,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    } else {
      throw new Error('Failed to create alipay order: ' + JSON.stringify(result));
    }
  } catch (error) {
    console.error('Error creating alipay order:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});