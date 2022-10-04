#pragma once

#include "NodeProp.h"
#include "JsiSkRRect.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkRRect.h>
#include <SkRect.h>

#pragma clang diagnostic pop

namespace RNSkia {

static PropId PropNameRx = JsiPropId::get("rx");
static PropId PropNameRy = JsiPropId::get("ry");
static PropId PropNameR = JsiPropId::get("r");

/**
 Reads a rect from a given propety in the node. The name of the property is provided on the constructor.
 The property can either be a Javascript property or a host object representing an SkRect.
 */
class RRectProp:
public JsiDerivedProp<SkRRect> {
public:
  RRectProp(PropId name):
  JsiDerivedProp() {
    _prop = addChildProp(std::make_shared<JsiObjectProp>(name));
  }
  
  void updateDerivedValue(NodePropsContainer* props) override {
    if (_prop->hasValue() && props->getHasPropChanges(_prop->getName())) {
      // Check for JsiSkRRect
      if(_prop->getPropValue()->getType() == PropType::HostObject) {
        // Try reading as rect
        auto rectPtr = std::dynamic_pointer_cast<JsiSkRRect>(_prop->getPropValue()->getAsHostObject());
        if (rectPtr == nullptr) {
          throw std::runtime_error("Could not read rounded rect from unknown host object type.");
        }
        auto rrect = rectPtr->getObject();
        setDerivedValue(SkRRect::MakeRectXY(SkRect::MakeXYWH(rrect->rect().x(), rrect->rect().y(),
                                                             rrect->rect().width(), rrect->rect().height()),
                                            rrect->getSimpleRadii().x(), rrect->getSimpleRadii().y()));
      } else if (_rx != nullptr){
        // Update cache from js object value
        setDerivedValue(SkRRect::MakeRectXY(SkRect::MakeXYWH(_x->getAsNumber(), _y->getAsNumber(),
                                                             _width->getAsNumber(), _height->getAsNumber()),
                                            _rx->getAsNumber(), _ry->getAsNumber()));
      }
    }
  }
  
  void setProps(jsi::Runtime &runtime, NodePropsContainer* props) override {
    JsiDerivedProp::setProps(runtime, props);
    
    if (_prop->hasValue() && _prop->getPropValue()->getType() == PropType::Object) {
      auto p = _prop->getPropValue();
      if (p->hasValue(PropNameX) &&
          p->hasValue(PropNameY) &&
          p->hasValue(PropNameWidth) &&
          p->hasValue(PropNameHeight) &&
          p->hasValue(PropNameRx) &&
          p->hasValue(PropNameRy)) {
        _x = _prop->getPropValue()->getValue(PropNameX);
        _y = _prop->getPropValue()->getValue(PropNameY);
        _width = _prop->getPropValue()->getValue(PropNameWidth);
        _height = _prop->getPropValue()->getValue(PropNameHeight);
        _rx = _prop->getPropValue()->getValue(PropNameRx);
        _ry = _prop->getPropValue()->getValue(PropNameRy);
      }
    }
  }
  
private:
  std::shared_ptr<JsiValue> _x;
  std::shared_ptr<JsiValue> _y;
  std::shared_ptr<JsiValue> _width;
  std::shared_ptr<JsiValue> _height;
  std::shared_ptr<JsiValue> _rx;
  std::shared_ptr<JsiValue> _ry;
  std::shared_ptr<JsiObjectProp> _prop;
};

/**
 Reads rect properties from a node's properties
 */
class RRectPropFromProps:
public JsiDerivedProp<SkRRect> {
public:
  RRectPropFromProps():
  JsiDerivedProp<SkRRect>() {
    _x = addChildProp(std::make_shared<NodeProp>(PropNameX, PropType::Number));
    _y = addChildProp(std::make_shared<NodeProp>(PropNameY, PropType::Number));
    _width = addChildProp(std::make_shared<NodeProp>(PropNameWidth, PropType::Number));
    _height = addChildProp(std::make_shared<NodeProp>(PropNameHeight, PropType::Number));
    _r = addChildProp(std::make_shared<NodeProp>(PropNameR, PropType::Number));
  }
  
  void updateDerivedValue(NodePropsContainer* props) {
    if(_x->hasValue() && _y->hasValue() && _width->hasValue() && _height->hasValue() && _r->hasValue()) {
      setDerivedValue(SkRRect::MakeRectXY(SkRect::MakeXYWH(_x->getPropValue()->getAsNumber(),
                                                           _y->getPropValue()->getAsNumber(),
                                                           _width->getPropValue()->getAsNumber(),
                                                           _height->getPropValue()->getAsNumber()),
                                          _r->getPropValue()->getAsNumber(), _r->getPropValue()->getAsNumber()));
    }
  }
  
private:
  std::shared_ptr<NodeProp> _x;
  std::shared_ptr<NodeProp> _y;
  std::shared_ptr<NodeProp> _width;
  std::shared_ptr<NodeProp> _height;
  std::shared_ptr<NodeProp> _r;
};

/**
 Reads rect props from either a given property or from the property object itself.
 */
class RRectProps:
  public JsiDerivedProp<SkRRect> {
public:
  RRectProps(PropId name):
    JsiDerivedProp<SkRRect>() {
    _rectProp = addChildProp<RRectProp>(std::make_shared<RRectProp>(name));
    _rectPropFromProps = addChildProp<RRectPropFromProps>(std::make_shared<RRectPropFromProps>());
  }
    
  void updateDerivedValue(NodePropsContainer* props) override {
    if (_rectProp->hasValue()) {
      setDerivedValue(_rectProp->getDerivedValue());
    } else if (_rectPropFromProps->hasValue()) {
      setDerivedValue(_rectPropFromProps->getDerivedValue());
    } else {
      throw std::runtime_error("Either the rect property or x/y/width/height must be set.");
    }
  }

private:
  std::shared_ptr<RRectProp> _rectProp;
  std::shared_ptr<RRectPropFromProps> _rectPropFromProps;
};
}

