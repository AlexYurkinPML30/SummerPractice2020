#version 300 es
  precision highp float;

  uniform int uRedCoef;
  uniform int uBlueCoef;
  uniform int uGreenCoef;
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform vec4 Area;
  uniform int isTexture;
  uniform int uRed, uGreen, uBlue;

  out vec4 oColor;

  vec2 CmplSet( float r, float i )
  {
    vec2 Res;
    Res.x = r;
    Res.y = i;

    return Res;
  }

  vec2 CmplAddCmpl( vec2 A, vec2 B )
  {
    return vec2(A.x + B.x, A.y + B.y);
  }

  vec2 CmplMulCmpl( vec2 A, vec2 B )
  {
    return vec2(A.x * B.x - A.y * B.y, A.x * B.y + A.y * B.x);
  }

  float CmplLen( vec2 A )
  {
    return A.x * A.x + A.y * A.y;
  }

  int Mandl( vec2 Z )
  {
    int n = 0;
    vec2 Z0 = Z;

    while (n < 255 && CmplLen(Z) < 4.)
    {
      Z = CmplAddCmpl(CmplMulCmpl(Z, Z), Z0);
      n++;
    }
    return n;
  }

  void main(void)
  {
    vec2 Z;
    int color;

    vec2 xy = Area.xz + gl_FragCoord.xy / 500.0 * (Area.yw - Area.xz);

    float dist = clamp(length(xy) / 0.5, 0.0, 1.0);
  
    float pi = 3.1415926535;
    float angle = uTime * 50.0;
    float c = cos(pi * angle / 180.0);
    float s = sin(pi * angle / 180.0);
  
    vec2 rxy;
    rxy.x = c * xy.x + s * xy.y;
    rxy.y = -s * xy.x + c * xy.y;
  
    xy = mix(rxy, xy, dist);
    Z = vec2(xy.x, xy.y);
  
    color = Mandl(Z);
    if (isTexture == 1)
    {
      oColor = texture(uTexture, vec2(float(color) / 255., 1. - float(color) / 255.)); 
      oColor = vec4(float(uRedCoef) * oColor.x / 255., float(uBlueCoef) * oColor.y / 255., float(uGreenCoef) * oColor.z / 255., 1);
    }
    else
    {
      oColor = vec4(float(color) / 255. * float(uRed) / 255., float(color) / 255. * float(uBlue) / 255., float(color) / 255. * float(uGreen) / 255., 1.);
    }
  }