#pragma once

#include "JsiDomNode.h"

namespace RNSkia {

static PropId PropNameTranslateX = JsiPropId::get("translateX");
static PropId PropNameTranslateY = JsiPropId::get("translateY");
static PropId PropNameScale = JsiPropId::get("scale");
static PropId PropNameScaleX = JsiPropId::get("scaleX");
static PropId PropNameScaleY = JsiPropId::get("scaleY");
static PropId PropNameSkewX = JsiPropId::get("skewX");
static PropId PropNameSkewY = JsiPropId::get("skewY");
static PropId PropNameRotate = JsiPropId::get("rotate");
static PropId PropNameRotateZ = JsiPropId::get("rotateZ");

class TransformProcessor {
public:
  /**
   Processes properties representing a React Native transform prop, accepting translateX, translateY, scale, "
   "scaleX, scaleY, skewX, skewY, rotate or rotateZ as transform values. Takes a matrix as a parameter and
   performs the matrix operations in order defined by the property. The property needs to be of type array.
   */
  static void processTransform(SkMatrix &m, std::shared_ptr<JsiValue> prop) {
    for (auto &el: prop->getAsArray()) {
      auto keys = el->getKeys();
      if (keys.size() == 0) {
        throw std::runtime_error("Empty value in transform. Expected translateX, translateY, scale, "
                                 "scaleX, scaleY, skewX, skewY, rotate or rotateZ.");
      }
      auto key = el->getKeys().at(0);
      auto value = el->getValue(key)->getAsNumber();
      if (key == PropNameTranslateX) {
        m.preTranslate(value, 0);
      } else if (key == PropNameTranslateY) {
        m.preTranslate(0, value);
      } else if (key == PropNameScale) {
        m.preScale(value, value);
      } else if (key == PropNameScaleX) {
        m.preScale(value, 1);
      } else if (key == PropNameScaleY) {
        m.preScale(1, value);
      } else if (key == PropNameSkewX) {
        m.preScale(value, 0);
      } else if (key == PropNameSkewY) {
        m.preScale(value, 0);
      } else if (key == PropNameRotate || key == PropNameRotateZ) {
        m.preRotate(SkRadiansToDegrees(value));
      } else {
        throw std::runtime_error("Unknown key in transform. Expected translateX, translateY, scale, "
                                 "scaleX, scaleY, skewX, skewY, rotate or rotateZ - got " + std::string(key) + ".");
      }
    }
  }
};

}
